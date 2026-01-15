import neatCSV from 'neat-csv';

describe('Bulk Create Client Contacts from CSV', () => {
  beforeEach(() => {
    // 1. Load CSV and alias it as 'contactsData'
    // This ensures data is ready before the test starts
    cy.fixture('csv/clientContact.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('contactsData');
      });

    // 2. Setup dictionary intercept to prevent dropdown race conditions
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');

    cy.login('admin', 'sample');
    cy.wait(4000);
  });

  it('Loops through CSV to add contacts to clients', function () {
    // Access the aliased data using 'this.contactsData'
    // Ensure you use 'function ()' in the line above to allow 'this'
    this.contactsData.forEach((contact) => {
      // Navigation to main Clients list
      cy.contains('Clients', { timeout: 10000 }).should('be.visible').click();
      cy.wait(2000);

      // Search for the client to handle pagination
      cy.get('input[placeholder*="Search"]').first().clear().type(contact.clientName);
      cy.contains('button', 'search').click();
      cy.wait(1000); // Wait for filter

      // Select the client using the 'clientName' header
      cy.contains(contact.clientName, { timeout: 10000 }).click();

      // Navigate to Contacts tab and open modal
      cy.contains('Contacts', { timeout: 10000 }).should('be.visible').click();
      cy.get('button').contains('add').click();

      // Wait for dictionaries to finish loading
      cy.wait('@getDictionaries');

      // --- FILL INFORMATION FROM CSV ---
      cy.get('#firstName').should('be.visible').clear().type(contact.firstName);
      cy.get('#lastName').should('be.visible').clear().type(contact.lastName);

      // Status Mapping (Active = 1)
      const statusId = contact.status === 'Active' ? '1' : '2';
      cy.get(`#statusCt-${statusId}`).click();

      // Gender Mapping (Male = 1, Female = 2)
      const genderId = contact.gender === 'Male' ? '1' : '2';
      cy.get(`#genderCt-${genderId}`).click();

      // Language selection using 'preferredLanguage'
      cy.get('.p-icon.p-select-dropdown-icon').click();
      cy.get('.p-select-overlay').contains('li', contact.preferredLanguage).click();
      cy.get('body').click(0, 0); // Close overlay to prevent covering next element

      // Contact Details using the new headers
      cy.get('#workEmail').clear().type(contact.workEmail);
      cy.get('#officePhone').clear().type(contact.officePhone);

      // Save and verify result
      cy.get('button').contains('Save Changes').click();

      // Verification: Ensure the name now appears in the UI
      cy.contains(contact.firstName).should('be.visible');

      // Return to main Clients list for the next loop iteration
      cy.visit('http://154.38.173.164:6980/home/tr-clients');
      cy.wait(2000);
    });
  });
});