describe('Bulk Create Contractors', () => {

  beforeEach(() => {
    // 1. Load data from fixtures
    cy.fixture('contractors').as('data');

    // 2. Login using your custom command
    cy.login('admin', 'sample');
    cy.wait(4000);

    // 3. Setup intercept for the dictionary loading (Status, Gender, etc.)
    // Move intercept here so it persists across all iterations if needed (though aliases reset per test, beforeEach runs per test)
    // Wait... beforeEach runs once per TEST ('it' block). The 'it' block here contains a loop.
    // So defining it here is safe.
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');
  });

  it('Loops through JSON to create multiple users', function () {
    this.data.forEach((user) => {
      cy.wait(3000);
      // Navigate to the list
      cy.contains('Contractors').should('be.visible').click();
      /* 
         Removed static wait here. The race condition is better handled 
         by waiting for the element inside the modal.
      */

      /* 
         CRITICAL FIX: 
         1. Open Modal (triggers the API call)
         2. Wait for the 'find-many' API call to complete 2 TIMES.
            (The network log shows this endpoint is hit twice: once for initial dicts, 
             once for others like Country/Supervisor. We must wait for BOTH).
         3. Add a short wait after the network call for rendering.
      */
      // Open Modal
      cy.contains('span.material-symbols-outlined', 'add').parents('button').click();
      cy.get('.p-dialog', { timeout: 10000 }).should('be.visible');

      // Wait for 2 responses since we see 2 calls in the network log
      cy.wait(['@getDictionaries', '@getDictionaries'], { timeout: 20000 }).then((interceptions) => {
        interceptions.forEach((interception) => {
          expect(interception.response.statusCode).to.eq(200);
        });
      });

      cy.wait(1000); // Increased UI breathing room

      // --- GENERAL INFORMATION ---
      cy.get('#firstName').clear().type(user.firstName);
      cy.get('#lastName').clear().type(user.lastName);


      // Robustly select 'Active' by text, then find the radio input associated with it
      // or simply rely on the text being clickable if the input is hidden
      cy.contains('label', 'Active').click();
      const genderMap = { "Male": "1", "Female": "2", "Unidentified": "3" };
      cy.get(`#genderCt-${genderMap[user.gender]}`).click();

      cy.get('#preferredLanCt').click();
      cy.get('.p-select-overlay').contains('li', 'English').click();

      cy.get('#supervisor').click();
      cy.get('.p-select-overlay').contains('li', user.supervisor).click();

      // --- COUNTRY ---
      cy.get('#countryCt').click();
      cy.get('input[role="searchbox"]').type(user.country);
      cy.get('.p-select-overlay').contains('li', user.country).click();

      // --- TIMEZONE (FIXED) ---
      cy.get('#timezoneCt').click();
      // We type the value from JSON and click the first option that contains that text
      cy.get('input[role="searchbox"]').type(user.timezone);
      cy.get('.p-select-overlay li').contains(user.timezone).first().click();

      // --- ACCOUNT DETAILS ---
      cy.get('#username').clear().type(user.username);
      cy.get('#password').find('input').type('Sample123.');
      cy.get('#confirmPassword').find('input').type('Sample123.');

      cy.get('p-multiselect').eq(1).click();
      cy.get('input[role="searchbox"]').type(user.role);
      cy.contains('li[role="option"]', user.role).click();
      cy.get('body').click(0, 0);

      // --- PRIVATE INFORMATION (Date of Birth) ---
      // Format: Day/Month/Year (Example: 8/Jan/1988)
      const formattedDate = `${user.dobDay}/${user.dobMonth}/${user.dobYear}`;

      cy.get("input[name='birthDate']")
        .click()
        .clear()
        .type(formattedDate, { force: true });

      // Close picker and commit
      cy.get('body').click(0, 0);
      cy.get("input[name='birthDate']").trigger('blur');

      // --- CONTACTS & ADDRESS ---
      cy.get('#address').clear().type(user.address);
      cy.get('#officeEmail').clear().type(user.officeEmail);
      cy.get('#email').clear().type(user.personalEmail);
      cy.get('#whatsapp').clear().type(user.whatsapp);
      cy.get('#phone').clear().type(user.whatsapp);

      // --- FINAL SUBMIT ---
      cy.wait(1000);
      cy.get('button.btn-primary').contains('Create New Contractor').click({ force: true });

      // Verification of success
      cy.url({ timeout: 20000 }).should('include', '/info');
      cy.contains(user.firstName).should('be.visible');
    });
  });
});