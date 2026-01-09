describe('Create new Project', () => {
  it('logs in and navigates to Project', () => {

    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]', { timeout: 10000 })
      .clear()
      .type('admin');

    cy.get('input[type="password"]', { timeout: 10000 })
      .clear()
      .type('sample', { log: false });

    cy.get("button[type='button']", { timeout: 10000 })
      .click();

    cy.contains('Projects', { timeout: 10000 })
      .should('be.visible')
      .click();
     
    cy.wait(4000);

    //Opens the modal
    cy.get('button').contains('add').click();

    cy.get('#code').type('Auto2');

    cy.get('#name').type('ProjectName1');

 
    // Open calendar
    cy.get('input[name="startDate"]').click();
    cy.get('.p-datepicker').should('be.visible');

    // Year
    cy.get('button[aria-label="Choose Year"]').click();
    cy.contains('.p-datepicker-year', '2021').click(); 

    // Month
    cy.contains('.p-datepicker-month', 'Jan').click();

    // Day
    cy.contains('.p-datepicker-day:not(.p-disabled)', '8')
    .should('be.visible')
    .click();

    // FORCE COMMIT (this is the missing piece)
    cy.get('input[name="startDate"]')
    .trigger('blur')
    .trigger('change');

    // OR click outside (sometimes required)
    cy.get('body').click(0, 0);

    // Assert value
    cy.get('input[name="startDate"]')
    .should('not.have.value', '');



    //Type dropdown
    cy.get('span[role="combobox"]#typeProjectCt')
    .should('be.visible')
    .click();

    cy.get("li[id='typeProjectCt_1'] div[class='ng-star-inserted']").click();

    //Description
    cy.get('#description').type('This is a sample project description');

    //Status dropdown
    cy.get('#statusCt')
      .should('be.visible')
      .click();

    cy.get("li[id='statusCt_1'] div[class='ng-star-inserted']").click();

    //Client dropdown
    cy.get('#organizationId')
      .should('be.visible')
      .click();

    cy.get('input[role="searchbox"]')
      .should('be.visible')
      .type('AutomationConta');

    // IMPORTANT: p-select overlay
    cy.get('.p-select-overlay')
      .should('be.visible')
      .contains('.p-select-option', 'AutomationContact')
      .click();

    // Contact Dropdown
    cy.get('#contactId')
      .should('be.visible')
      .click();

    cy.get('input[role="searchbox"]')
      .should('be.visible')
      .type('ContactFirstName');

    // Click option inside p-select overlay
    cy.get('.p-select-overlay')
      .should('be.visible')
      .contains('.p-select-option', 'ContactFirstName')
      .click();


    //Internal Manager
    cy.get('#internalManagerUserId').should('be.visible').click();

    cy.get('input[role="searchbox"]').type('Admin User');

    cy.get('.p-select-overlay')
      .contains('li', 'Admin User')
      .click();
    
    //Account Manager
    cy.get('#accountManagerUserId').should('be.visible').click();

    cy.get('input[role="searchbox"]').type('Admin User');

    cy.get('.p-select-overlay')
      .contains('li', 'Admin User')
      .click();

    //Main Language
    cy.get('#mainLanguageCt').click();
    cy.get('#mainLanguageCt_0').click();
   
 
    //Saves the created project
    cy.get('.p-dialog')
      .should('be.visible')
      .contains('button', 'Create New Project')
      .should('be.enabled')
      .click();


  });
});



