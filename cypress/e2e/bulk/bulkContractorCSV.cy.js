import neatCSV from 'neat-csv';

describe('Bulk Create Contractors from CSV', () => {

  beforeEach(() => {
    // 1. Setup intercept for the dictionaries
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');

    // 2. Load CSV and parse it
    cy.fixture('csv/contractors.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('contractors');
      });

    // 3. Login
    cy.login('admin', 'sample');

    // Wait for initial load
    cy.wait(['@getDictionaries', '@getDictionaries'], { timeout: 15000 });
  });

  it('Loops through CSV to create multiple users', function () {
    this.contractors.forEach((user) => {
      // Navigate to the list
      cy.contains('Contractors').should('be.visible').click();

      // Wait for table to ensure page is stable
      cy.get('table', { timeout: 10000 }).should('be.visible');

      // Open Modal
      cy.contains('span.material-symbols-outlined', 'add').parents('button').click();

      // Verification: Check if the modal is visible
      cy.get('.p-dialog').should('be.visible');

      // --- CRITICAL FIX START ---
      // 1. Wait for the specific data call that populates the Status/Gender fields
      cy.wait('@getDictionaries');

      // 2. Guard against Angular animations (the .ng-animating class seen in your error log)
      // This ensures the modal is finished "sliding in" before we click inside it.
      cy.get('.p-dialog').should('not.have.class', 'ng-animating');

      // 3. Robust selection of 'Active'
      // We look for 'Active' specifically within the dialog to avoid background matches
      cy.get('.p-dialog')
        .contains('label', 'Active', { timeout: 10000 })
        .should('be.visible')
        .click();
      // --- CRITICAL FIX END ---



      // --- GENERAL INFORMATION ---
      //--- First and Last Name ---
      cy.get('#firstName').clear().type(user.firstName);
      cy.get('#lastName').clear().type(user.lastName);

      //--- Gender ---
      const genderMap = { "Male": "1", "Female": "2", "Unidentified": "3" };
      cy.get(`#genderCt-${genderMap[user.gender]}`, { timeout: 5000 })
        .should('exist')
        .click();

      //--- Language ---
      cy.get('#preferredLanCt').click();
      cy.get('.p-select-overlay').contains('li', 'English').click();

      //--- SUPERVISOR ---
      cy.get('#supervisor').click();
      cy.get('.p-select-overlay').should('be.visible');
      cy.contains('.p-select-overlay li[role="option"]', new RegExp(`^\\s*${user.supervisor}\\s*$`, ''))
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });

      cy.get('.p-select-overlay').should('not.exist');
      cy.get('body').click(0, 0);

      //--- COUNTRY ---
      cy.get('#countryCt').click();
      cy.get('input[role="searchbox"]').type(user.country);
      cy.get('.p-select-overlay').contains('li', user.country).click();

      //--- TIMEZONE ---
      cy.get('#timezoneCt').click();
      cy.get('input[role="searchbox"]').type(user.timezone);
      cy.get('.p-select-overlay li').contains(user.timezone).first().click();

      //--- ACCOUNT DETAILS ---
      //--- Password ---
      cy.get('#username').clear().type(user.username);
      cy.get('#password').find('input').type('Sample123.');
      cy.get('#confirmPassword').find('input').type('Sample123.');

      //--- Role ---
      cy.get('p-multiselect').eq(1).click();
      cy.get('input[role="searchbox"]').type(user.role);
      cy.contains('li[role="option"]', user.role).click();
      cy.get('body').click(0, 0);

      //--- DATE OF BIRTH ---
      const [day, monthNum, year] = user.birthDate.split('/');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[parseInt(monthNum, 10) - 1];
      const formattedDate = `${parseInt(day, 10)}/${monthName}/${year}`;

      cy.get("input[name='birthDate']")
        .click()
        .clear()
        .type(formattedDate, { force: true });

      cy.get('body').click(0, 0);
      cy.get("input[name='birthDate']").trigger('blur');

      //--- CONTACTS & ADDRESS ---
      cy.get('#address').clear().type(user.address);
      cy.get('#officeEmail').clear().type(user.officeEmail);
      cy.get('#email').clear().type(user.personalEmail);
      cy.get('#whatsapp').clear().type(user.whatsapp);
      cy.get('#phone').clear().type(user.whatsapp);

      //--- FINAL SUBMIT ---
      cy.wait(1000); // Small buffer for stability
      cy.get('button.btn-primary').contains('Create New Contractor').click({ force: true });

      // Verification of success
      cy.url({ timeout: 20000 }).should('include', '/info');
      cy.contains(user.firstName).should('be.visible');
    });
  });
});