// cypress/e2e/Clients.cy.js
import 'cypress-file-upload';
describe('Clients Management Test', () => {

  it('Creates a new Client record', () => {

    // 1️⃣ Login
    cy.visit('http://154.38.173.164:6980');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[type="password"]').type('sample');
    cy.get("button[type='button']").click();
    cy.wait(2000);

    // 2️⃣ Navigate to Contractors
    cy.contains('Clients').click();

    // 3️⃣ Open modal

    cy.contains('Create New Client').click();

    // 4️⃣ Fill fields
    
    // Box fields
    cy.get('#name').clear().type('Esteban');
    cy.get('#shortName').clear().type('Test');
    cy.get('#website').clear().type('testing.qa');
    cy.get('#hqAddress').clear().type('Tarija - cercado');
    cy.get('#phone').clear().type('1234567890');
    cy.get('#emailAddress').clear().type('Test@qa.com');
    cy.get('#description').clear().type('Test description');
   // Dropdown fields
    cy.get('#clientTypeCt').click();
    cy.get('#clientTypeCt_list').should('be.visible');
    cy.get('#clientTypeCt_list').contains('For Profit')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);
    
    cy.get('#preferredLanguageCt').click();
    cy.get('#preferredLanguageCt_list').should('be.visible');
    cy.get('#preferredLanguageCt_list').contains('English')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);
   
    cy.get('#sourcedBy').click();
    cy.get('#sourcedBy_list').should('be.visible');
    cy.get('#sourcedBy_list').contains('Sales')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);
   
    // search dropdown fields
    cy.get('#countryCt').click();
    cy.get('input.p-select-filter[aria-owns="countryCt_list"]').type('Bolivia');
    cy.get('#countryCt_list').contains('Bolivia')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);
    
    // search dropdown multiselect fields
    cy.get('.p-multiselect')
     .eq(0)
     .click();
    cy.get('input.p-multiselect-filter')
     .should('exist')
     .should('be.visible')
     .focus()
     .type('animal', { force: true });
    cy.contains('li[role="option"]', 'Animal protection')
      .should('be.visible')
      .click();
    cy.contains('li[role="option"]', 'Animal protection')
      .should('have.attr', 'aria-selected', 'true');
    
    cy.get('input.p-multiselect-filter')
      .clear()
      .type('education', { force: true });

    cy.contains('li[role="option"]', 'Education')
      .should('be.visible')
      .click()
      .should('have.attr', 'aria-checked', 'true');
      cy.get('body').click(0,0); 

     cy.get('.p-multiselect')
      .eq(1)
      .click();
    cy.get('input.p-multiselect-filter')
     .should('exist')
     .should('be.visible')
     .focus()
     .type('spanish', { force: true });
    cy.contains('li[role="option"]', 'Spanish')
      .should('be.visible')
      .click();
    cy.contains('li[role="option"]', 'Spanish')
      .should('have.attr', 'aria-selected', 'true')
      .and('have.attr', 'aria-checked', 'true');
    
    cy.get('input.p-multiselect-filter')
      .clear()
      .type('english', { force: true });

    cy.contains('li[role="option"]', 'English')
      .should('be.visible')
      .click()
      .should('have.attr', 'aria-checked', 'true');
      cy.get('body').click(0,0); 
    
      //radiobutton
    cy.get('#statusCt-1').should('be.visible').click();

    // Document
    const filePath = 'Test_image_640×426.png'; 
    cy.get('input[data-testid="logo"]').attachFile(filePath)
      .should('have.prop', 'files'); 

// Creation click
    cy.get('.p-dialog:visible')
      .contains('button', 'Create New Client')
      .click();

  });
});
