import neatCSV from 'neat-csv';

describe('Bulk Create Contractors from CSV', () => {

  beforeEach(() => {
    // 1. Setup intercepts
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');
    cy.intercept('POST', '**/gen/count-by').as('uniquenessCheck');
    // INTERCEPT THE CREATE CALL
    // Based on standard patterns, it likely posts to /gen/entities/Contractor or similar
    // Using a broader wildcard or checking network logs would be ideal, but trying the entity endpoint:
    cy.intercept('POST', '**/gen/entities/Contractor').as('createContractor');

    // 2. Load CSV
    cy.fixture('csv/01_contractors.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('contractors');
      });

    // 3. Login
    cy.login('admin', 'sample');
    cy.wait(['@getDictionaries', '@getDictionaries'], { timeout: 15000 });
  });

  it('Loops through CSV to create multiple users', function () {
    this.contractors.forEach((user) => {
      // --- NAVIGATION ---
      cy.contains('Contractors').should('be.visible').click();
      cy.url({ timeout: 10000 }).should('include', 'tr-contractors');
      cy.get('table', { timeout: 10000 }).should('be.visible');

      // Supervisor check
      if (user.supervisor && user.supervisor !== 'Admin User') {
        const supervisorFirst = user.supervisor.split(' ')[0];
        cy.contains('table tbody tr', supervisorFirst, { timeout: 20000 }).should('exist');
      }

      // Open Modal
      cy.contains('span.material-symbols-outlined', 'add').parents('button').click();
      cy.get('.p-dialog').should('be.visible');

      // Wait for modal data load and animation
      cy.wait('@getDictionaries');
      cy.get('.p-dialog').should('not.have.class', 'ng-animating');

      // --- FORM FILLING ---
      // Status
      cy.get('.p-dialog').contains('Active').should('exist').click({ force: true });

      // Names
      cy.get('#firstName').clear().type(user.firstName);
      cy.get('#lastName').clear().type(user.lastName);

      // Gender
      const genderMap = { "Male": "1", "Female": "2", "Unidentified": "3" };
      cy.get(`#genderCt-${genderMap[user.gender]}`).click();

      // Language
      cy.get('#preferredLanCt').click();
      cy.get('.p-select-overlay').contains('li', 'English').click();

      // Supervisor Selection
      cy.get('#supervisor').click();
      cy.get('.p-select-overlay').should('be.visible');
      cy.contains('.p-select-overlay li[role="option"]', new RegExp(`^\\s*${user.supervisor}\\s*$`, ''))
        .scrollIntoView()
        .click({ force: true });
      cy.get('body').type('{esc}');
      cy.get('#supervisor').should('contain', user.supervisor);

      // Country & Timezone
      cy.get('#countryCt').click();
      cy.get('input[role="searchbox"]').type(user.country);
      cy.get('.p-select-overlay').contains('li', user.country).click();

      cy.get('#timezoneCt').click();
      cy.get('input[role="searchbox"]').type(user.timezone);
      cy.get('.p-select-overlay li').contains(user.timezone).first().click();

      // Account Details
      cy.get('#username').clear().type(user.username);
      cy.get('#password').find('input').type('Sample123.');
      cy.get('#confirmPassword').find('input').type('Sample123.');

      // Roles
      const roles = user.role.split('|');
      cy.get('p-multiselect').eq(1).click();
      roles.forEach((role) => {
        cy.get('input[role="searchbox"]').clear().type(role.trim());
        cy.contains('li[role="option"]', role.trim()).click();
      });
      cy.get('body').click(0, 0);

      // Birth Date
      const [day, monthNum, year] = user.birthDate.split('/');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${parseInt(day, 10)}/${monthNames[parseInt(monthNum, 10) - 1]}/${year}`;

      cy.get("input[name='birthDate']").click().clear().type(formattedDate, { force: true });
      cy.get('body').click(0, 0).trigger('blur');

      // Contact
      cy.get('#address').clear().type(user.address);
      cy.get('#officeEmail').clear().type(user.officeEmail);
      cy.get('#email').clear().type(user.personalEmail);
      cy.get('#whatsapp').clear().type(user.whatsapp);
      cy.get('#phone').clear().type(user.whatsapp);

      // --- SUBMIT LOGIC (STABILIZED) ---

      // 1. Ensure any temporary overlays (toasts) are gone
      cy.get('.p-toast-message').should('not.exist');

      // 2. Wait for the uniqueness check API to return successfully
      // This prevents clicking "Create" while the backend is still validating the email/username
      cy.wait('@uniquenessCheck').its('response.statusCode').should('eq', 200);

      // 3. Verify no frontend validation errors exist
      cy.get('.p-error').should('not.exist');

      // 5. Instead of strict network wait (which is fragile without exact URL), 
      // we use a robust retry loop to ensures the action completes.

      const trySubmit = (attempts = 0) => {
        if (attempts > 3) throw new Error('Failed to submit form after multiple attempts');

        cy.url().then(url => {
          if (!url.includes('/info')) {
            cy.log(`Attempt ${attempts + 1}: Clicking submit button`);
            cy.get('button.btn-primary')
              .contains('Create New Contractor')
              .should('be.visible')
              .should('not.be.disabled')
              .click({ force: true });

            // Wait for potential completion
            cy.wait(4000);

            // Recursive check
            cy.url().then(newUrl => {
              if (!newUrl.includes('/info')) {
                trySubmit(attempts + 1);
              }
            });
          }
        });
      };

      trySubmit();

      // 6. Strict verification of navigation
      cy.url({ timeout: 20000 }).should('include', '/info');
      cy.contains(user.firstName).should('be.visible');

      // 7. COOLDOWN: Give the app a moment to "breathe" before starting the next loop
      // This helps prevent the ERR_EMPTY_RESPONSE errors seen in your console
      cy.wait(1500);
    });
  });
});