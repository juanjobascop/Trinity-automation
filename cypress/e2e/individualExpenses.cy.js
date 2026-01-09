describe('Create new Expense', () => {
  beforeEach(() => {
    // Load fixtures
    cy.fixture('expenses').as('data');

    // Login logic (abstracted if possible, but kept explicit here as per file pattern)
    cy.visit('http://154.38.173.164:6980');
    cy.get('input[name="username"]', { timeout: 10000 }).clear().type('atreus');
    cy.get('input[type="password"]', { timeout: 10000 }).clear().type('Sample123.', { log: false });
    cy.get("button[type='button']", { timeout: 10000 }).click();
  });

  it('logs in and navigates to Expense', function () {
    this.data.forEach((expense) => {
      // Navigate to My Expenses (Consider hard refresh or nav per loop if needed)
      // Here we assume we are already logged in from beforeEach, but we need to ensure we are at the list/home
      // For stability, let's navigate via UI from dashboard or verify URL.
      // Since beforeEach logs in and lands on Dashboard, we click 'My expenses'.

      cy.contains('My expenses', { timeout: 10000 }).should('be.visible').click();

      cy.wait(4000); // UI Breathing room

      // Opens the modal
      cy.get('button').contains('Create new').click();

      // Wait for modal
      cy.get('.p-dialog', { timeout: 15000 }).should('be.visible');

      // --- DATE PICKER LOGIC ---
      const formattedDate = `${expense.dobDay}/${expense.dobMonth}/${expense.dobYear}`;

      cy.get("input[name='date']")
        .click({ force: true })
        .clear({ force: true })
        .type(formattedDate, { force: true })
        .trigger('blur');

      cy.get('body').click(0, 0);
      cy.wait(500);

      // --- FORM FIELDS ---

      // -----Project-----
      cy.get('#projectCt').click();

      // Type 'Administrative' in search box if available, or just click element
      cy.get("input[role='searchbox']")
        .should('be.visible')
        .type('Administrati');

      // Select 'Administrative' from the list
      cy.get('.p-select-option')
        .contains('Administrative')
        .click();

      // -----Category-----
      cy.get('#categoryCt').click();

      // Type 'Other' in search box if available, or just click element
      cy.get("input[role='searchbox']")
        .should('be.visible')
        .type('Other');

      // Select 'Other' from the list
      cy.get('.p-select-option')
        .contains('Other Expenses')
        .click();

      // -----Description-----
      cy.get('#description').type("Lorem Ipsum");

      // -----Currency field-----
      cy.get('#currencyCt').click();

      // Type 'BO' in search box if available, or just click element
      cy.get("input[role='searchbox']")
        .should('be.visible')
        .type('BO');

      // Select 'BOB' from the list
      cy.get('.p-select-option')
        .contains('BOB')
        .click();

      // -----Amount field-----
      cy.get('#amount').type("1000");

      // -----Additional Fee field-----
      cy.get("input[name='fee']")
        .click({ force: true })
        .clear({ force: true })
        .type("1000");

      // -----Saves the created expense-----
      cy.get('.p-dialog')
        .should('be.visible')
        .contains('button', 'Create New Expense')
        .should('be.enabled')
        .click();


    });
  });
});
