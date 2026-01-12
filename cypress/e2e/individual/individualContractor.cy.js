describe('Create new Contractor', () => {
  it('logs in and navigates to Contractor', () => {

    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]', { timeout: 10000 })
      .clear()
      .type('admin');

    cy.get('input[type="password"]', { timeout: 10000 })
      .clear()
      .type('sample', { log: false });

    cy.get("button[type='button']", { timeout: 10000 })
      .click();

    cy.contains('Contractors', { timeout: 10000 })
      .should('be.visible')
      .click();
    // Open the "Create Contractor" modal with GUARDS so that everything is fully loaded before interacting.
    cy.contains('span.material-symbols-outlined', 'add')
      .parents('button')
      .click();

    // GUARD: Don't look for inputs until the Modal Container is fully rendered
    // We increase timeout to 10 seconds to account for slow loading
    cy.get('.p-dialog', { timeout: 10000 }).should('be.visible');

    // GUARD: Wait for the LAST element to appear.
    // If the last element (Role) is ready, the first element (Status) is definitely ready.
    cy.get('p-multiselect', { timeout: 10000 }).should('exist');

    // Now interact with the first field
    cy.get('input#status-active', { timeout: 10000 }).click({ force: true });

    // --------Name & Last name--------
    cy.get('#firstName').should('be.visible').clear()
      .type('CypressFirstName').should('have.value', 'CypressFirstName');
    cy.get('#lastName').should('be.visible').clear()
      .type('CypressLastName').should('have.value', 'CypressLastName');

    // --------Status--------
    cy.get('input#status-active').click();

    // --------Gender--------
    cy.get('input#genderCt-1').click();

    // --------Preferred Language--------
    cy.get('#preferredLanCt').click();
    cy.get('#preferredLanCt_0').click();

    // --------Office mail--------
    cy.get('#officeEmail').clear().type('test@test.com')
      .should('have.value', 'test@test.com');

    // --------Whatsapp--------
    cy.get('#whatsapp').clear().type('1234567890')
      .should('have.value', '1234567890');

    // --------Supervisor--------
    cy.get('#supervisor').click();
    cy.get('.p-select-overlay')
      .contains('li', 'Admin User')
      .click();

    // --------Country--------
    cy.get('#countryCt').click();
    cy.get('input[role="searchbox"]').type('Boliv');
    cy.get('.p-select-overlay')
      .contains('li', 'Bolivia')
      .click();

    // --------Timezone--------
    cy.get('#timezoneCt').click();
    cy.get('input[role="searchbox"]').type('Boliv');
    cy.get('.p-select-overlay')
      .contains('li', 'Bolivia')
      .click();

    //--------Username--------
    cy.get('#username').should('be.visible').clear()
      .type('cypressUser2').should('have.value', 'cypressUser2');

    //--------Password--------
    cy.get('#password').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    //--------Confirm Password--------
    cy.get('#confirmPassword').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    //--------Role multiselect--------
    // Open multiselect (click the real trigger)
    cy.get('p-multiselect')
      .eq(1)
      .find('.p-multiselect-label-container')
      .click();

    cy.get('input[role="searchbox"]')
      .should('be.visible')
      .type('Contr');

    //--------Contractor--------
    cy.contains('li[role="option"]', 'Contractor')
      .should('be.visible')
      .click();

    //Close panel
    cy.get('body').click(0, 0);

    // Assert the value INSIDE THE MODAL
    cy.get('.p-dialog p-multiselect')
      .find('.p-multiselect-label')
      .should('contain.text', 'Contractor');


    //--------Date of birth--------
    cy.get("input[name='birthDate']").click();
    cy.get('.p-datepicker').should('be.visible');

    // Open year picker
    cy.get('button[aria-label="Choose Year"]').click();

    // Assert initial decade
    cy.contains('2020 - 2029').should('be.visible');

    // Go back one decade
    cy.get('button[aria-label="Previous Decade"]').click();

    // Assert new decade
    cy.contains('2010 - 2019').should('be.visible');

    // Select year directly (NO Choose Year click, Assert new decade
    cy.contains('2010 - 2019').should('be.visible');

    // Select year 2010 (CORRECT)
    cy.contains('.p-datepicker-year:not(.p-disabled)', '2010')
      .should('be.visible')
      .click();

    // Month view opened
    cy.contains('.p-datepicker-month', 'Jan').should('be.visible').click();

    // Day
    cy.contains('.p-datepicker-day:not(.p-disabled)', '8')
      .should('be.visible')
      .click();

    // FORCE COMMIT (this is the missing piece)
    cy.get("input[name='birthDate']")
      .trigger('blur')
      .trigger('change');

    // OR click outside (sometimes required)
    cy.get('body').click(0, 0);

    // Assert value
    // Assert Angular really accepted it
    cy.get("input[name='birthDate']")
      .should('have.value', '8/Jan/2010');


    //--------Address--------
    cy.get('#address').type('This is a test');

    //--------Personal email--------
    cy.get('#email').clear().type('personal2@test.com').should('have.value', 'personal2@test.com');

    //--------Mobile phone--------
    cy.get('#phone').type('1234567890');


    //Click the modal's footer area (neutral area) to ensure focus/closure of panels.
    cy.get('.flex.flex-row.justify-end.gap-4.mt-4.ng-star-inserted')
      .click({ force: true });


    //--------FINAL STEP - assert: click the create button to submit the form.--------
    cy.get('.p-dialog')
      .should('be.visible')
      .contains('button', 'Create New Contractor')
      .should('be.enabled')
      .click();








  });
});