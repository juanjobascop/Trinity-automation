import neatCSV from 'neat-csv';

describe('Bulk Create Expenses from CSV', () => {

  beforeEach(() => {
    // 1. Load CSV and parse it
    cy.fixture('csv/expenses.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('expenses');
      });
  });

  it('Loops through CSV to create multiple expenses', function () {
    this.expenses.forEach((expense) => {
      // --- LOG IN (Per Loop) ---
      // The user requested to log in using credentials from the CSV for each iteration
      cy.login(expense.username, expense.password);

      // Ensure we are at the dashboard or a stable starting point
      cy.url().should('not.include', '/login');
      cy.wait(2000);

      // --- NAVIGATE TO EXPENSES ---
      cy.contains('My expenses', { timeout: 10000 }).should('be.visible').click();
      cy.wait(4000); // UI Breathing room

      // --- OPEN MODAL ---
      cy.get('button').contains('Create new').click();
      cy.get('.p-dialog', { timeout: 15000 }).should('be.visible');

      // --- DATE PICKER ---
      const formattedDate = `${expense.dobDay}/${expense.dobMonth}/${expense.dobYear}`;
      cy.get("input[name='date']")
        .click({ force: true })
        .clear({ force: true })
        .type(formattedDate, { force: true })
        .trigger('blur');

      cy.get('body').click(0, 0);
      cy.wait(500);

      // --- FORM FIELDS ---

      // Project
      cy.get('#projectCt').click();
      cy.get("input[role='searchbox']").should('be.visible').type(expense.project.substring(0, 4));
      cy.get('.p-select-option').contains(expense.project).click();

      // Category
      cy.get('#categoryCt').click();
      cy.get("input[role='searchbox']").should('be.visible').type("Other"); // Assuming 'Other' is strictly what we want or based on CSV? 
      // User CSV has "Other Expenses"
      cy.get('.p-select-option').contains(expense.category).click();

      // Description
      cy.get('#description').type(expense.description);

      // Currency
      cy.get('#currencyCt').click();
      cy.get("input[role='searchbox']").should('be.visible').type(expense.currency);
      cy.get('.p-select-option').contains(expense.currency).click();

      // Amount
      cy.get('#amount').type(expense.amount);

      // Fee
      cy.get("input[name='fee']")
        .click({ force: true })
        .clear({ force: true })
        .type(expense.fee);

      // --- SUBMIT ---
      cy.get('.p-dialog')
        .contains('button', 'Create New Expense')
        .should('be.enabled')
        .click();

      // Verify and reset for next loop (Log out? or just next Login will handle it?)
      // cy.login() custom command often starts by visiting the login page, which handles the reset.
      // We wait a bit to ensure the modal closes and success message might appear
      cy.wait(2000);
    });
  });
});
