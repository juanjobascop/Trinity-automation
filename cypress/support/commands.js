Cypress.Commands.add('login', (username, password) => {
  cy.visit('http://154.38.173.164:6980');
  cy.get('input[name="username"]').clear().type(username);
  cy.get('input[type="password"]').clear().type(password, { log: false });
  cy.get("button[type='button']").click();
  // Ensure we are logged in by checking the sidebar or a main element
  cy.contains('Contractors', { timeout: 10000 }).should('be.visible');
});