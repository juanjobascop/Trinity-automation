import neatCSV from 'neat-csv';


describe('Bulk Create Contractor Contracts from CSV', () => {

  beforeEach(() => {
    // 1. Load the CSV from the new organized directory
    cy.fixture('csv/contractorContract.csv')
      .then(neatCSV)
      .then((data) => {
        // Alias the data to 'contractsData' to ensure it is ready before the test starts
        cy.wrap(data).as('contractsData');
      });

    // 2. Standard Login and Navigation setup
    cy.login('admin', 'sample');
    cy.wait(4000);
  });

  it('Iterates through CSV to add contracts to contractors', function () {
    // 1. Access data via alias to ensure availability
    cy.get('@contractsData').then((contractsData) => {
      // Validate Data Loaded
      if (!contractsData || contractsData.length === 0) {
        throw new Error("No data found in CSV! The test cannot proceed.");
      }
      cy.log(`Loaded ${contractsData.length} records.`);

      contractsData.forEach((contract) => {
        cy.log(`Processing contractor: ${contract.contractorName}`);

        // 2. Navigation to Contractor
        cy.contains('Contractors').should('be.visible').click();

        cy.get('input[placeholder="Search"]').should('be.visible').clear().type(contract.searchName);
        cy.contains('span', 'search').click();
        cy.wait(1000); // Wait for search results

        // Click contractor (force if necessary or just wait)
        cy.contains(contract.contractorName, { timeout: 10000 }).should('be.visible').click();

        // 3. Open Modal
        cy.contains('Contracts').should('be.visible').click();
        cy.contains('Add New Contract').should('be.visible').click();

        // Verify Modal is Open
        cy.get('.p-dialog').should('be.visible');

        // 4. Fill Form
        cy.get('input[name="rateHour"]').clear().type(contract.rate).should('have.value', contract.rate);

        // Contract Type (Fixed/Hourly) - using selector from valid test
        cy.get('#typeContractCt-1').should('be.visible').click();

        // Currency
        cy.get('#currencyCt').click();
        cy.get('input.p-select-filter[aria-owns="currencyCt_list"]').type(contract.currency);
        cy.get('#currencyCt_list li').should('be.visible').first().click();
        cy.get('body').click(0, 0);

        // Timezone
        cy.get('#timezoneCt').click();
        cy.get('input.p-select-filter[aria-owns="timezoneCt_list"]').type(contract.timezoneSearch);
        cy.wait(1000); // Verify filter has time to process
        cy.get('#timezoneCt_list li').should('be.visible').first().click();
        cy.get('body').click(0, 0);

        // Area
        cy.get('#areaCt').click();
        cy.get('input.p-select-filter[aria-owns="areaCt_list"]').type(contract.areaSearch);
        cy.get('#areaCt_list li').should('be.visible').first().click();
        cy.get('body').click(0, 0);

        // Position
        cy.get('#positionCt').click();
        cy.get('#positionCt_list').should('be.visible');
        cy.get('#positionCt_list li').contains(contract.position).should('be.visible').click(); // Position is exact match usually safe, but check consistency
        cy.get('body').click(0, 0);

        // Dates
        cy.get('input[name="startDate"]').clear().type(contract.startDate);
        cy.get('body').click(0, 0);
        cy.get('input[name="finishDate"]').clear().type(contract.finishDate);
        cy.get('body').click(0, 0);

        cy.get('#notes').clear().type(contract.notes);

        // File Upload
        cy.get('input[data-testid="document"]').selectFile(`cypress/fixtures/${contract.documentFile}`, { force: true });

        // Submit
        cy.contains('Create New Contract').should('not.be.disabled').click();

        // Verification: Wait for dialog to close
        cy.get('.p-dialog', { timeout: 20000 }).should('not.exist');

        // Verify the contract appears in the list (e.g. by Start Date or Position)
        cy.contains(contract.startDate).should('be.visible');

        // Reset for next iteration
        cy.visit('http://154.38.173.164:6980/home/tr-contractors');
        cy.wait(2000);
      });
    });
  });
});