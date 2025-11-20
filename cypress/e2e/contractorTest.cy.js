// cypress/e2e/contractorTest.cy.js
// Stable end-to-end test for Create Contractor modal (radios + selects)
describe('Contractor Management Test (stable)', () => {

  // Small helper: disable animations so Cypress doesn't race with CSS transitions.
  function disableAnimations() {
    cy.document().then(doc => {
      const style = doc.createElement('style');
      style.innerHTML = `
        * {
          transition: none !important;
          animation: none !important;
        }
      `;
      doc.head.appendChild(style);
    });
  }

  // Helper to check a radio input, click label if input is not visible
  function checkRadio(inputSelector, labelFor) {
    cy.get(inputSelector, { timeout: 10000 }).then($input => {
      if ($input.is(':visible')) {
        cy.wrap($input).check({ force: false }).should('be.checked');
      } else {
        // fallback to clicking label (the visible control)
        cy.get(`label[for="${labelFor}"]`, { timeout: 10000 })
          .should('be.visible')
          .click()
          .then(() => cy.get(inputSelector).should('be.checked'));
      }
    });
  }

  // Helper to select a PrimeNG option by substring and close the list
  function selectPrimeAndClose(selectId, matchSubstring) {
    const trigger = `#${selectId} div[role="button"][aria-label="dropdown trigger"]`;
    const listSelector = `#${selectId}_list`;

    // open
    cy.get(`#${selectId}`).find('div[role="button"][aria-label="dropdown trigger"]')
      .should('be.visible').click();

    // wait list visible
    cy.get(listSelector, { timeout: 10000 }).should('be.visible');

    // find the li that contains the substring in its textContent
    cy.get(listSelector).find('li[role="option"]', { timeout: 10000 })
      .then($items => {
        const found = Array.from($items).find(el =>
          el.textContent && el.textContent.includes(matchSubstring)
        );
        expect(found, `option containing "${matchSubstring}"`).to.exist;
        cy.wrap(found).scrollIntoView().should('be.visible').click();
      });

    // collapse by focusing neutral element inside modal
    cy.get('#firstName').should('be.visible').click();

    // ensure list closed (works if removed or hidden)
    cy.get(listSelector, { timeout: 5000 }).should($list => {
      if ($list.length === 0) return;
      // if present, it must be not visible
      expect($list[0].offsetParent === null || $list.not(':visible').length > 0).to.be.true;
    });

    // assert label shows the substring
    cy.get(`#${selectId}`).find('.p-select-label, span.p-select-label')
      .should('contain.text', matchSubstring);
  }

  it('Opens modal and fills fields reliably', () => {
    // disable animations immediately
    disableAnimations();

    // visit and login (intercept login)
    cy.intercept('POST', '**/user/login').as('login');
    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]').clear().type('admin');
    cy.get('input[type="password"]').clear().type('sample', { log: false });

    // Use scoped click on the login form's submit button (less generic)
    cy.get("button[type='button']").click();
    cy.wait('@login').its('response.statusCode').should('eq', 200);

    // go to contractors
    cy.contains('Contractors').should('be.visible').click();

    // Define modal-needed XHRs BEFORE opening the modal
    cy.intercept('POST', '**/gen/find-many').as('findMany');
    cy.intercept('POST', '**/catalogs/get-catalogs').as('getCatalogs');
    // add any other modal-related requests if you see them in the network logs
    // e.g. cy.intercept('POST', '**/user/get-paginated').as('getUsers');

    // open modal
    cy.get("div.w-full.flex.items-center.gap-2").should('be.visible').click();

    // Wait for modal-related XHRs to finish
    cy.wait('@findMany', { timeout: 10000 });
    cy.wait('@getCatalogs', { timeout: 10000 });

    // Wait for the modal container and for the labels that indicate the form block is rendered.
    cy.get('p-dynamicdialog .p-dialog-content', { timeout: 10000 }).should('be.visible');

    // Wait specifically for STATUS and GENDER labels so radio area is rendered
    // Wait for the radio inputs to exist — this is more reliable than matching the visible label text
    cy.get('input#status-active', { timeout: 10000 }).should('exist');
    cy.get('input#status-inactive', { timeout: 10000 }).should('exist');

    // Wait for at least one gender radio input (IDs may differ — adjust if needed)
    cy.get('input#genderCt-0, input#genderCt-1, input#genderCt-2', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .and('exist');

    // Fill text fields with asserts
    cy.get('#firstName').should('be.visible').clear().type('CypressFirstName').should('have.value', 'CypressFirstName');
    cy.get('#lastName').should('be.visible').clear().type('CypressLastName').should('have.value', 'CypressLastName');

    // Radios: use checkRadio helper
    checkRadio('input#status-active', 'status-active');
    checkRadio('input#genderCt-1', 'genderCt-1');

    // Preferred language select (example using helper)
    selectPrimeAndClose('preferredLanCt', 'English');

    // other inputs
    cy.get('#officeEmail').clear().type('test@test.com').should('have.value', 'test@test.com');
    cy.get('#whatsapp').clear().type('1234567890').should('have.value', '1234567890');

    // Supervisor select
    selectPrimeAndClose('supervisor', 'Admin User');

    // Country select (Bolivia)
    selectPrimeAndClose('countryCt', 'Bolivia');

    // Timezone select (Bolivia/Atlantic Standard) — use stable substring
    selectPrimeAndClose('timezoneCt', 'Bolivia/Atlantic Standard');

    // username
    cy.get('#username').clear().type('cypresstest').should('have.value', 'cypresstest');

    // (Optional) submit and assert success if desired:
    // cy.get('button').contains('Create New Contractor').click();
    // cy.contains('success message').should('be.visible');


    // PASSWORD (target the inner input)
    cy.get('#password').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    // CONFIRM PASSWORD (target the inner input)
    cy.get('#confirmPassword').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');


    
    //ADDRESS FIELD
    cy.get('#address').type('This is a test');


    //Personal Email
    cy.get('#email').clear().type('personal@test.com').should('have.value', 'personal@test.com');

    //Phone
    cy.get('#phone').type('1234567890');

    //CONTRACTOR FIELD BLOCKED









    //DATEPICKER FIELD
cy.get("input[name='birthDate']").click();




   
    





  });
});
