// cypress/e2e/Contracts.cy.js
import 'cypress-file-upload';
describe('Contractor Management Test', () => {

  it('Creates a new contractor record', () => {

    // 1️⃣ Login
    cy.visit('http://154.38.173.164:6980');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[type="password"]').type('sample');
    cy.get("button[type='button']").click();
    cy.wait(2000);

    // 2️⃣ Navigate to Contractors
    cy.contains('Contractors').click();

    // 3️⃣ Open Contractor
    cy.get('input[placeholder="Search"]').type('intern');
    cy.contains('span', 'search').click();
    cy.contains('female').click();
    cy.contains('Contracts').click();
    cy.contains('Add New Contract').click();

    // 4️⃣ Intercept POST request to verify submission
    cy.intercept('POST', '**/contracts').as('createContract');

    // 5️⃣ Fill fields


    cy.get('input[name="rateHour"]').clear().type('20').should('have.value', '20');
    
    cy.get('#typeContractCt-1').should('be.visible').click();
    
    cy.get('#currencyCt').click();
    cy.get('input.p-select-filter[aria-owns="currencyCt_list"]').type('USD');
    cy.get('#currencyCt_list').contains('USD')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);

    cy.get('#timezoneCt').click();
    cy.get('input.p-select-filter[aria-owns="timezoneCt_list"]').type('bolivia');
    cy.get('#timezoneCt_list')
      .contains('UTC−04:00 (Bolivia/Atlantic Standard)')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);

    cy.get('#areaCt').click();
    cy.get('input.p-select-filter[aria-owns="areaCt_list"]').type('quality');
    cy.get('#areaCt_list').contains('Quality Assurance')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);

    cy.get('#positionCt').click();
    cy.get('#positionCt_list').should('be.visible');
    cy.get('#positionCt_list').contains('QA Lead')
      .should('be.visible')
      .click();
    cy.get('body').click(0,0);

    cy.get('input[name="startDate"]').clear().type('21/Nov/2024');
    cy.get('body').click(0,0);
    cy.get('input[name="finishDate"]').clear().type('01/Feb/2025');
    cy.get('body').click(0,0);

    cy.get('#notes').clear().type('This is a note for the contractor.');

    const filePath = 'testDoc.txt'; 
    cy.get('input[data-testid="document"]').attachFile(filePath)
      .should('have.prop', 'files'); 

    cy.contains('Create New Contract')
      .should('not.be.disabled') 
      .click();

  });
});
