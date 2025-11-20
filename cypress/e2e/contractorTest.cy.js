describe('Contractor Management Test', () => {

  it('Opens modal with radios visible', () => {

    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]').type('admin');
    cy.get('input[type="password"]').type('sample');
    cy.get("button[type='button']").click();
    cy.wait(2000);

    // Navigate
    cy.contains('Contractors').click();

    // LISTEN to modal XHRs
    cy.intercept('POST', '**/gen/find-many').as('findMany');
    cy.intercept('POST', '**/catalogs/get-catalogs').as('getCatalogs');

    // OPEN Modal
    cy.get("div.w-full.flex.items-center.gap-2").click();

    // WAIT for XHR data to load
    cy.wait('@findMany');
    cy.wait('@getCatalogs');

    // NOW everything is rendered
    cy.get('#firstName').type('CypressFirstName');
    cy.get('#lastName').type('CypressLastName');
    cy.get('#status-active').should('be.visible').click();

  });

});
