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
      cy.wait(4000);

      // --- OPEN MODAL ---
      cy.get('button').contains('Create new').click();
      cy.get('.p-dialog', { timeout: 15000 }).should('be.visible');

      //--- DATE PICKER ---
      // --- DATE PICKER ---
      const [day, monthNum, year] = expense.date.split('/');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[parseInt(monthNum, 10) - 1];
      const formattedDate = `${parseInt(day, 10)}/${monthName}/${year}`;

      cy.get("input[name='date']")
        .click({ force: true })
        .clear({ force: true })
        .type(formattedDate, { force: true })
        .trigger('blur');

      cy.get('body').click(0, 0);
      cy.wait(500);

      // --- FORM FIELDS ---

      // Helper for robust dropdown selection
      const selectDropdown = (selector, targetValue) => {
        cy.get(selector).should('be.visible').click({ force: true });

        cy.get('.p-select-panel, .p-select-overlay', { timeout: 15000 }).should('be.visible').then(($overlay) => {
          const filter = $overlay.find('input.p-select-filter, input[role="searchbox"]');

          if (filter.length > 0) {
            // Filterable dropdown
            cy.wrap(filter).clear().type(targetValue);
            cy.wait(500); // Optimized wait

            // Try to click exact match first, else visible option
            cy.wrap($overlay).find('li').filter(':visible').contains(targetValue).click({ force: true });
          } else {
            // Non-filterable dropdown
            cy.wrap($overlay).find('li').contains(targetValue).scrollIntoView().should('be.visible').click();
          }
        });

        // Check if overlay is still there
        cy.get('body').then(($body) => {
          if ($body.find('.p-select-overlay, .p-select-panel').filter(':visible').length > 0) {
            // Try pressing ESC to close it
            cy.get('body').type('{esc}');
          }
        });

        cy.get('.p-select-overlay, .p-select-panel').should('not.exist');
        cy.get(selector).should('contain', targetValue);
      };

      // Project
      selectDropdown('#projectCt', expense.project);

      // Category
      selectDropdown('#categoryCt', expense.category);

      // Description
      cy.get('#description').type(expense.description);

      // Currency
      selectDropdown('#currencyCt', expense.currency);

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

    });
  });
});
