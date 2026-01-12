import neatCSV from 'neat-csv';

describe('Bulk Create Projects from CSV', () => {
  beforeEach(() => {
    // 1. Load CSV and alias it as 'projectData'
    cy.fixture('csv/projects.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('projectData');
      });

    // 2. Setup dictionary intercept
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');

    cy.login('admin', 'sample');
    cy.wait(4000);
  });

  it('Loops through CSV to create projects', function () {
    // Access data using 'this.projectData' (requires 'function' syntax above)
    this.projectData.forEach((project) => {
      // Navigate to Projects
      cy.contains('Projects', { timeout: 10000 }).should('be.visible').click();
      cy.wait(2000);

      // Open Modal
      cy.get('button').contains('add').click();
      cy.get('.p-dialog', { timeout: 10000 }).should('be.visible');

      // Basic Information using 'projectCode'
      cy.get('#code').clear().type(project.projectCode);
      cy.get('#name').clear().type(project.projectName);

      // --- DATE PICKER ---
      cy.get('input[name="startDate"]').click();
      cy.get('button[aria-label="Choose Year"]').click();
      cy.contains('.p-datepicker-year', project.startYear).click();
      cy.contains('.p-datepicker-month', project.startMonth).click();
      cy.contains('.p-datepicker-day:not(.p-disabled)', project.startDay).click();

      // Force commit date selection
      cy.get('input[name="startDate"]').trigger('blur').trigger('change');
      cy.get('body').click(0, 0);

      // --- DROPDOWNS & SEARCHBOXES ---
      // Project Type
      cy.get('#typeProjectCt').click();
      cy.get('.p-select-option').first().click();

      cy.get('#description').clear().type(project.description);

      // Status
      cy.get('#statusCt').click();
      cy.get('.p-select-option').first().click();

      // Client Selection
      cy.get('#organizationId').click();
      cy.get('input[role="searchbox"]').type(project.clientName);
      cy.get('.p-select-overlay').contains('.p-select-option', project.clientName).click();

      // Contact Selection
      cy.get('#contactId').click();
      cy.get('input[role="searchbox"]').type(project.contactName);
      cy.get('.p-select-overlay').contains('.p-select-option', project.contactName).click();

      // Managers
      cy.get('#internalManagerUserId').click();
      cy.get('input[role="searchbox"]').type(project.internalManager);
      cy.get('.p-select-overlay').contains('li', project.internalManager).click();

      cy.get('#accountManagerUserId').click();
      cy.get('input[role="searchbox"]').type(project.accountManager);
      cy.get('.p-select-overlay').contains('li', project.accountManager).click();

      // Language selection
      cy.get('#mainLanguageCt').click();
      cy.get('.p-select-overlay').contains(project.mainLanguage).click();

      // --- SUBMIT ---
      cy.get('.p-dialog').contains('button', 'Create New Project').click();

      // Verification of success

      cy.contains(project.projectName).should('be.visible');

      // Return to main list for next user
      cy.visit('http://154.38.173.164:6980/home/tr-projects');
      cy.wait(2000);
    });
  });
});