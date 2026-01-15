import neatCSV from 'neat-csv';

// Global error handler to prevent test failure during server 503 instability
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Bulk Create Contractor Contracts from CSV', () => {
  beforeEach(() => {
    // Load CSV data
    cy.fixture('csv/contractorContract.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('contractsData');
      });

    // Setup network intercepts for stability
    cy.intercept('POST', '**/user/get-paginated').as('getContractors');
    cy.intercept('POST', '**/gen/insert-contract').as('createContract');

    cy.login('admin', 'sample');
    cy.location('pathname', { timeout: 20000 }).should('include', '/home');
  });

  it('Iterates through CSV to add contracts', function () {
    cy.get('@contractsData').then((contractsData) => {
      contractsData.forEach((contract) => {

        // --- STEP 1: NAVIGATION & SEARCH ---
        cy.contains('Contractors', { timeout: 20000 }).should('be.visible').click();

        cy.get('input[placeholder="Search"]').first()
          .should('be.visible')
          .clear()
          .type(contract.searchName);

        cy.contains('span', 'search').click();

        // Wait for search results and ensure loading overlay is gone
        cy.wait('@getContractors', { timeout: 30000 });
        cy.contains('Loading Data', { timeout: 20000 }).should('not.exist');
        cy.wait(2000);

        cy.get('td.ng-star-inserted').contains(contract.contractorName, { timeout: 15000 })
          .should('be.visible')
          .click();

        // --- STEP 2: OPEN MODAL ---
        cy.contains('Contracts', { timeout: 20000 }).should('be.visible').click();
        cy.contains('Add New Contract', { timeout: 20000 }).click({ force: true });
        cy.get('.p-dialog', { timeout: 20000 }).should('be.visible');

        // Fill basic rate info
        const normalizedRate = contract.rate.replace(',', '.');
        cy.get('input[name="rateHour"]').clear().type(normalizedRate);
        cy.get('#typeContractCt-1').click();

        // Dropdown Helper
        const selectDropdown = (selector, targetValue) => {
          cy.get(selector).should('be.visible').click({ force: true });

          cy.get('.p-select-overlay', { timeout: 15000 }).should('be.visible').then(($overlay) => {
            const filter = $overlay.find('input.p-select-filter');

            if (filter.length > 0) {
              // Filterable dropdown (Timezone, Area)
              cy.wrap(filter).clear().type(targetValue);
              cy.wait(500); // Optimized wait
              cy.wrap($overlay).find('li').filter(':visible').first().click({ force: true });
            } else {
              // Non-filterable dropdown (Currency) - Select exact match
              // Ensure we find the exact text, ensure it's visible, scroll to it, then click WITHOUT force
              cy.wrap($overlay).find('li').contains(targetValue).scrollIntoView().should('be.visible').click();
            }
          });

          // Check if overlay is still there
          cy.get('body').then(($body) => {
            if ($body.find('.p-select-overlay').length > 0) {
              // Try pressing ESC to close it
              cy.get('body').type('{esc}');
            }
          });

          cy.get('.p-select-overlay').should('not.exist');

          // Verify selection (if label updates)
          cy.get(selector).should('contain', targetValue);
        };

        selectDropdown('#currencyCt', contract.currency);
        selectDropdown('#timezoneCt', contract.timezoneSearch);
        selectDropdown('#areaCt', contract.areaSearch);
        selectDropdown('#positionCt', contract.position);

        // --- STEP 3: DATES (Integrated Formatting Logic) ---
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const getFormattedDate = (dateStr) => {
          if (!dateStr) return '';
          const [day, monthNum, year] = dateStr.split('/');
          const monthName = monthNames[parseInt(monthNum, 10) - 1];
          return `${parseInt(day, 10)}/${monthName}/${year}`;
        };

        const formattedStart = getFormattedDate(contract.startDate);
        const formattedFinish = getFormattedDate(contract.finishDate);

        // Start Date
        cy.get('input[name="startDate"]')
          .click({ force: true })
          .clear({ force: true })
          .type(formattedStart, { force: true });

        cy.get('.p-dialog-header').click(); // Close calendar overlay
        cy.get('input[name="startDate"]').trigger('blur');

        // Finish Date
        cy.get('input[name="finishDate"]')
          .click({ force: true })
          .clear({ force: true })
          .type(formattedFinish, { force: true });

        cy.get('.p-dialog-header').click();
        cy.get('input[name="finishDate"]').trigger('blur');

        // --- STEP 4: SUBMIT ---
        const fileName = contract.documentFile || 'testDoc.txt';
        cy.get('input[data-testid="document"]').selectFile(`cypress/fixtures/${fileName}`, { force: true });

        cy.contains('button', /Create New Contract/i).should('not.be.disabled').click();

        // Long timeout for the 503-prone backend
        cy.wait('@createContract', { timeout: 60000 });
        cy.get('.p-dialog', { timeout: 60000 }).should('not.exist');

        // Verify formatted date exists in the table
        cy.contains(formattedStart, { timeout: 20000 }).should('be.visible');
        cy.wait(2000);
      });
    });
  });
});