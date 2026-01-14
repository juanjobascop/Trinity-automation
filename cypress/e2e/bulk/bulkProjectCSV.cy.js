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
      const [day, monthNum, year] = project.startDate.split('/');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[parseInt(monthNum, 10) - 1];
      const formattedDate = `${parseInt(day, 10)}/${monthName}/${year}`;

      cy.get("input[name='startDate']")
        .click()
        .clear()
        .type(formattedDate, { force: true });

      cy.get('body').click(0, 0);
      cy.get("input[name='startDate']").trigger('blur');

      // Force commit date selection
      cy.get('input[name="startDate"]').trigger('blur').trigger('change');
      cy.get('body').click(0, 0);

      // --- DROPDOWNS & SEARCHBOXES ---
      // Project Type
      cy.get('#typeProjectCt').click();
      cy.get('input.p-select-filter').should('be.visible').clear().type(project.projectType);
      cy.get('ul[role="listbox"]').contains('li', project.projectType).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      cy.get('#description').clear().type(project.description);

      // Status
      cy.get('#statusCt').click();
      cy.get('.p-select-option').first().click();
      cy.get('body').type('{esc}'); // Robust close
      cy.get('.p-select-overlay').should('not.exist');
      cy.get('body').click(0, 0); // Safety close

      // Client Selection
      cy.get('#organizationId').click();
      cy.get('input[role="searchbox"]').type(project.clientName);
      cy.get('.p-select-overlay').contains('.p-select-option', project.clientName).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      // Contact Selection
      cy.get('#contactId').click();
      cy.get('input[role="searchbox"]').type(project.contactName);
      cy.get('.p-select-overlay').contains('.p-select-option', project.contactName).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      // Managers
      cy.get('#internalManagerUserId').click();
      cy.get('input[role="searchbox"]').type(project.internalManager);
      cy.get('.p-select-overlay').contains('li', project.internalManager).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      cy.get('#accountManagerUserId').click();
      cy.get('input[role="searchbox"]').type(project.accountManager);
      cy.get('.p-select-overlay').contains('li', project.accountManager).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      // Language selection
      cy.get('#mainLanguageCt').click();
      cy.get('.p-select-overlay').contains(project.mainLanguage).click();
      cy.get('body').type('{esc}');
      cy.get('.p-select-overlay').should('not.exist');

      // --- SUBMIT ---
      cy.get('.p-dialog').contains('button', 'Create New Project').click();

      // Verification of success

      // Verification: Check if we are redirected to the project detail page
      cy.url({ timeout: 15000 }).should('include', '/tr-projects/');
      cy.contains(project.projectName, { timeout: 10000 }).should('be.visible');

      // Return to main list for next user
      cy.visit('http://154.38.173.164:6980/home/tr-projects');
      cy.wait(2000);
    });
  });
});
