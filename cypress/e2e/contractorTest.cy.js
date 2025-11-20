describe('Contractor Management Test', () => {

  it('Logs in and opens the Create Contractor modal', () => {
    
    // 1. Visit the URL
    cy.visit('http://154.38.173.164:6980');
    cy.wait(2000); // Wait for 1 second to ensure the page loads

    // 2. Log in
    // Note: I am guessing the specific ID of the input boxes based on standard practices.
    // If these fail, we will use the "Selector Playground" to find the real ones.
    
    // Finds the input for username and types 'admin'
    cy.get('input[name="username"]').type('admin'); 
    
    // Finds the input for password and types 'sample'
    cy.get('input[type="password"]').type('sample');
    
    // Finds the button with type="submit" and clicks it
    cy.get("button[type='button']").click();
    cy.wait(3000);
    // 3. Wait for dashboard to load (Optional but good practice)
    // We verify the URL changed or we see the dashboard
    cy.url().should('not.include', 'login');

    // 4. Click on the "Contractors" tab
    // 'cy.contains' looks for that specific text anywhere on the page
    cy.contains('Contractors').click();
    cy.wait(2000); // Wait for 2 seconds to ensure the Contractors page loads
    // 5. Click the "+ Create new contractor" button
    cy.get("div[class='w-full flex items-center gap-2']").click();
    cy.wait(2000); // Wait for 2 seconds to ensure the modal opens
    // 6. Verify the Modal is actually open
    // We check if the page now contains the header text of the modal
    //cy.contains('Create new contractor').should('be.visible');


    //We will check field by field if the locators are correct
    cy.get('#firstName').type('CypressFirstName');
    cy.get('#lastName').type('CypressLastName');
    cy.pause(); 
    //cy.get('#status-active').check(); // Status radio button is not working, the radio buttons appear hidden in cypress
    cy.contains('ACTIVE').click({ force: true });
    
  });

});