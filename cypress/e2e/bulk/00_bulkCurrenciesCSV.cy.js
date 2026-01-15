import neatCSV from 'neat-csv';

describe('Bulk Create Currencies from CSV', () => {
  beforeEach(() => {
    // 1. Load CSV and alias it as 'projectData'
    cy.fixture('csv/exchangeCurrency.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('currencyData');
      });

    // 2. Setup dictionary intercept
    cy.intercept('POST', '**/gen/find-many').as('getDictionaries');

    cy.login('admin', 'sample');
    cy.wait(4000);
  });

  it('Loops through CSV to create projects', function () {
    this.currencyData.forEach((currency) => {
      // Navigate to Page (Safeguard)
      cy.contains('Exchange Rates', { timeout: 10000 }).should('be.visible').click();

      // Open Modal
      cy.wait(1000);
      cy.contains('button', 'Add New Currency').should('be.visible').click({ force: true });

      // Ensure modal is fully loaded
      cy.get('.p-dialog').should('be.visible').within(() => {

        // 1. Fill Amount (Right side)
        // Using 'type' with a small delay helps Angular/PrimeNG detect change
        cy.get("input[name='rate']").last()
          .clear()
          .type(currency.Rate, { delay: 50 });

        // 2. Fill Currency Code (Right side)
        // Triggering 'blur' ensures the validation message disappears
        cy.get("input[type='text']").last()
          .clear()
          .type(currency.Currency, { delay: 50 })
          .blur();

        // 3. Remove simple click from here, handle it robustly below
      });

      // Retry logic for Save button (Outside .within context to access body)
      // This handles cases where the button click is ignored due to pending validation or animations
      const saveAndVerify = (attempts = 0) => {
        if (attempts > 3) throw new Error('Failed to close modal after multiple save attempts');

        cy.get('body').then($body => {
          if ($body.find('.p-dialog').length > 0) {
            cy.log(`Attempt ${attempts + 1}: Clicking Save rate`);

            // Ensure we target the visible button inside the dialog
            cy.get('.p-dialog').contains('button', /save rate/i).click({ force: true });

            cy.wait(2000); // Wait for reaction

            // Recursively check
            cy.get('body').then($newBody => {
              if ($newBody.find('.p-dialog').length > 0) {
                saveAndVerify(attempts + 1);
              }
            });
          }
        });
      };

      saveAndVerify();

      // 4. Wait for the dialog to be removed from DOM
      cy.get('.p-dialog', { timeout: 20000 }).should('not.exist');

      // 5. Verification
      cy.contains(currency.Currency).should('be.visible');

      // 6. Reset for next iteration (Critical for loop stability)
      // Navigate by UI instead of hardcoded URL to avoid cross-origin issues
      cy.log('Resetting for next iteration...');
      cy.contains('Exchange Rates').click();
      cy.wait(2000);
    });
  });
});
