// cypress/e2e/Contracts.cy.js
import 'cypress-file-upload';
describe('Contractor Management Test', () => {

  // ============================================================
  // REUSABLE CONFIGURATION - Populate from JSON
  // ============================================================
  const contractData = {
    searchName: 'maria intern', // Search term for contractor
    contractorName: 'lopez', // Contractor's identifying name/text to click
    rate: '20', // Hourly rate
    currency: 'USD', // Currency code
    timezoneSearch: 'bolivia', // Text to search for timezone
    timezoneSelect: 'UTC−04:00 (Bolivia/Atlantic Standard)', // Exact timezone text to select
    areaSearch: 'quality', // Text to search for area
    areaSelect: 'Quality Assurance', // Exact area text to select
    position: 'QA Lead', // Exact position text to select
    startDate: '01/Jan/2026', // Start Date
    finishDate: '01/Dec/2026' // Finish Date
  };

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
    cy.get('input[placeholder="Search"]').type(contractData.searchName);
    cy.contains('span', 'search').click();
    cy.contains(contractData.contractorName).click();
    cy.contains('Contracts').click();
    cy.contains('Add New Contract').click();

    // 4️⃣ Intercept POST request to verify submission
    cy.intercept('POST', '**/contracts').as('createContract');

    // 5️⃣ Fill fields

    cy.get('input[name="rateHour"]').clear().type(contractData.rate).should('have.value', contractData.rate);

    cy.get('#typeContractCt-1').should('be.visible').click();

    cy.get('#currencyCt').click();
    cy.get('input.p-select-filter[aria-owns="currencyCt_list"]').type(contractData.currency);
    cy.get('#currencyCt_list').contains(contractData.currency)
      .should('be.visible')
      .click();
    cy.get('body').click(0, 0);

    cy.get('#timezoneCt').click();
    cy.get('input.p-select-filter[aria-owns="timezoneCt_list"]').type(contractData.timezoneSearch);
    cy.get('#timezoneCt_list')
      .contains(contractData.timezoneSelect)
      .should('be.visible')
      .click();
    cy.get('body').click(0, 0);

    cy.get('#areaCt').click();
    cy.get('input.p-select-filter[aria-owns="areaCt_list"]').type(contractData.areaSearch);
    cy.get('#areaCt_list').contains(contractData.areaSelect)
      .should('be.visible')
      .click();
    cy.get('body').click(0, 0);

    cy.get('#positionCt').click();
    cy.get('#positionCt_list').should('be.visible');
    cy.get('#positionCt_list').contains(contractData.position)
      .should('be.visible')
      .click();
    cy.get('body').click(0, 0);

    cy.get('input[name="startDate"]').clear().type(contractData.startDate);
    cy.get('body').click(0, 0);
    cy.get('input[name="finishDate"]').clear().type(contractData.finishDate);
    cy.get('body').click(0, 0);

    cy.get('#notes').clear().type('This is a note for the contractor.');

    const filePath = 'testDoc.txt';
    cy.get('input[data-testid="document"]').attachFile(filePath)
      .should('have.prop', 'files');

    cy.contains('Create New Contract')
      .should('not.be.disabled')
      .click();

  });
});
