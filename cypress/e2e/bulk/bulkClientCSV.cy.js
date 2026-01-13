import neatCSV from 'neat-csv';

describe('Bulk Create Clients from CSV', () => {
  beforeEach(() => {
    // 1. Load the CSV from the new sub-folder
    cy.fixture('csv/client.csv')
      .then(neatCSV)
      .then((data) => {
        cy.wrap(data).as('clientsData');
      });

    cy.login('admin', 'sample');
    cy.wait(4000);
  });

  it('Iterates through CSV to create clients', function () {
    // Using 'function' to access 'this.clientsData'
    this.clientsData.forEach((client) => {
      cy.contains('Clients').click();
      cy.contains('Create New Client').click();
      cy.get('.p-dialog').should('be.visible');

      // --- TEXT FIELDS ---
      cy.get('#name').clear().type(client.clientName);
      cy.get('#shortName').clear().type(client.shortName);
      cy.get('#website').clear().type(client.website);
      cy.get('#hqAddress').clear().type(client.hqAddress);
      cy.get('#phone').clear().type(client.phone);
      cy.get('#emailAddress').clear().type(client.emailAddress);
      cy.get('#description').clear().type(client.description);

      // --- DROPDOWNS ---
      const dropdowns = [
        { id: '#clientTypeCt', val: client.clientType },
        { id: '#preferredLanguageCt', val: client.preferredLanguage },
        { id: '#sourcedBy', val: client.sourcedBy }
      ];

      dropdowns.forEach(dd => {
        cy.get(dd.id).click({ force: true });
        cy.wait(500); // Allow list animation

        // Debug: Log all options to help identify mismatches
        cy.get(`${dd.id}_list`).then($list => {
          const options = $list.find('li').toArray().map(el => el.innerText);
          cy.log(`Options for ${dd.id}: ${options.join(', ')}`);
        });

        cy.get(`${dd.id}_list`).contains('li', dd.val).click();
        cy.get('body').click(0, 0);
      });

      // --- COUNTRY SEARCH ---
      cy.get('#countryCt').click();
      cy.get('input.p-select-filter').type(client.country);
      cy.get('#countryCt_list').contains(client.country).click();
      cy.get('body').click(0, 0);

      // --- MULTI-SELECTS (Sectors & Languages) ---
      // Sector selection (index 0)
      cy.get('.p-multiselect').eq(0).click();
      client.sectors.split('|').forEach(sector => {
        cy.get('input.p-multiselect-filter').clear().type(sector, { force: true });
        cy.contains('li[role="option"]', sector).click();
      });
      cy.get('body').click(0, 0);

      // Language selection (index 1)
      cy.get('.p-multiselect').eq(1).click();
      client.languages.split('|').forEach(lang => {
        cy.get('input.p-multiselect-filter').clear().type(lang, { force: true });
        cy.contains('li[role="option"]', lang).click();
      });
      cy.get('body').click(0, 0);

      // --- STATUS & LOGO ---
      const statusId = client.status === 'Active' ? '1' : '2';
      cy.get(`#statusCt-${statusId}`).click();

      // Ensure the image is in fixtures/
      cy.get('input[data-testid="logo"]').selectFile(`cypress/fixtures/Test_image_640×426.png`, { force: true });

      // --- SUBMIT ---
      cy.get('.p-dialog:visible').contains('button', 'Create New Client').click();

      // Wait for dialog to close to ensure submission
      cy.get('.p-dialog', { timeout: 20000 }).should('not.exist');

      // Success verification and reset
      cy.contains(client.clientName, { timeout: 10000 }).should('be.visible');
      cy.visit('http://154.38.173.164:6980/home/tr-clients');
      cy.wait(2000);
    });
  });
});