describe('Create new Clients contacts', () => {
  it('logs in and navigates to Contractors', () => {

    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]', { timeout: 10000 })
      .clear()
      .type('admin');

    cy.get('input[type="password"]', { timeout: 10000 })
      .clear()
      .type('sample', { log: false });

    cy.get("button[type='button']", { timeout: 10000 })
      .click();

    cy.contains('Clients', { timeout: 10000 })
      .should('be.visible')
      .click();
     
    cy.wait(2000);

    //Selects a created client 
    cy.contains('AutomationContact', { timeout: 10000 }).click();

    cy.contains('Contacts', { timeout: 10000 }).click();

    //Opens the Contacts modal
    cy.get('button').contains('add').click();

    cy.get('#firstName').should('be.visible').clear()
      .type('ContactFirstName').should('have.value', 'ContactFirstName');

    cy.get('#lastName').should('be.visible').clear()
      .type('ContactLastName').should('have.value', 'ContactLastName');

    cy.get('#statusCt-1').click();

    cy.get('#genderCt-1').click();

    cy.get('.p-icon.p-select-dropdown-icon').click();
    cy.get('#preferredLanguageCt_2').click();

    cy.get('#workEmail').type('contact@mail.com');

    cy.get('#officePhone').type('1234567890');

    cy.get('button[class="btn bg-[#067523] text-white p-4 ng-star-inserted"]').contains('Save Changes').click();

  });
});
