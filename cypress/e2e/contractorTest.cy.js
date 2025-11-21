// contractorTest.stable.cy.js
// Updated stable E2E Cypress test for Create Contractor modal
// Debug screenshots and references:
// - modal network/debug: /mnt/data/c11e75fb-3a43-42d3-bfd6-0a840af7d5f7.png
// - overlay cover error: /mnt/data/a1f5c531-eac1-47a9-aeec-d278f62b3a45.png

// NOTE: This file is intentionally defensive: it waits for XHRs when appropriate,
// opens dropdowns before waiting for them, ensures overlays are closed before
// interacting with inputs, and includes retries/timeouts for slow environments.

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

  // Ensure that any open overlay/panel is closed before continuing.
  // This clicks outside the modal and waits a tiny bit for panels to disappear.
  function ensurePanelsClosed() {
    // Click top-left corner of the modal overlay (safe neutral spot)
    cy.get('body').then($b => {
      // Click a neutral spot - (10,10) relative to body to close overlays
      cy.get('body').click(10, 10, { force: true });
    });
    // small wait to allow DOM updates (only as a safety net)
    cy.wait(100);
    // also assert no common overlay panels are visible
    cy.get('body').then($body => {
      const visiblePanel = $body.find('.p-dropdown-panel:visible, .p-multiselect-panel:visible, .p-overlaypanel:visible, #preferredLanCt_list:visible').length;
      if (visiblePanel) {
        // if something still visible, click neutral area again
        cy.get('body').click(10, 10, { force: true });
        cy.wait(100);
      }
    });
  }

  // Helper to check a radio input, click label if input is not visible
  function checkRadio(inputSelector, labelFor) {
    cy.get(inputSelector, { timeout: 10000 }).then($input => {
      if ($input.is(':visible')) {
        cy.wrap($input).check({ force: false }).should('be.checked');
      } else {
        cy.get(`label[for="${labelFor}"]`, { timeout: 10000 })
          .should('be.visible')
          .click()
          .then(() => cy.get(inputSelector).should('be.checked'));
      }
    });
  }

  /**
   * Robust PrimeNG select helper
   * - selectId: id attribute of the p-dropdown/p-multiselect wrapper (string)
   * - matchSubstring: substring of the option to click (string)
   * - optXhrAlias: optional alias of the XHR that fetches options (e.g. '@getSupervisors')
   *
   * Behavior:
   *  - Clicks the trigger first (handles lazy-loading)
   *  - Optionally waits for the provided XHR alias after opening
   *  - Locates the overlay panel appended to body and clicks the matched option
   *  - Ensures the panel is closed and the wrapper shows the selected text
   */
  function selectPrimeAndClose(selectId, matchSubstring, optXhrAlias = null) {
    const wrapper = `#${selectId}`;
    const triggerSel = `${wrapper} div[role="button"], ${wrapper} .p-dropdown-trigger, ${wrapper} .p-multiselect-label-container, ${wrapper} .p-component.p-iconwrapper`;

    // 1) click the trigger (retry until visible / actionable)
    cy.get(triggerSel, { timeout: 15000 })
      .first()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    // 2) If an XHR alias is provided and the app fetches on open, wait for it now
    if (optXhrAlias) {
      cy.wait(optXhrAlias, { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 201, 204]);
    }

    // 3) locate the overlay/panel anywhere in the body
    const possiblePanels = [
      `#${selectId}_list`,
      `.p-dropdown-panel`,
      `.p-multiselect-panel`,
      `.p-selectpanel`,
      `.p-overlaypanel`,
      `.p-autocomplete-panel`,
      `.p-calendar`
    ];
    const panelSelector = possiblePanels.join(',');

    // 4) Wait until a visible panel exists and has options
    cy.get('body', { timeout: 15000 }).then($body => {
      const found = $body.find(panelSelector).filter(':visible').first();
      if (!found || found.length === 0) {
        // wait for any known panel to become visible
        cy.get(panelSelector, { timeout: 15000 }).filter(':visible').first().as('activePanel');
      } else {
        cy.wrap(found).as('activePanel');
      }
    });

    // 5) inside the panel, wait for the option elements to be present and contain the text
    cy.get('@activePanel', { timeout: 15000 }).should('be.visible').within(() => {
      cy.get('li[role="option"], .p-dropdown-item, .p-selectitem', { timeout: 15000 })
        .should('have.length.greaterThan', 0);

      // find the option by substring and click it
      cy.contains('li[role="option"], .p-dropdown-item, .p-selectitem', matchSubstring, { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });

    // 6) collapse by clicking a neutral element inside the modal to ensure the panel is closed
    cy.get('#firstName', { timeout: 5000 }).should('be.visible').click();

    // 7) assert the wrapper's label/placeholder shows the selection
    cy.get(wrapper).find('.p-select-label, .p-multiselect-label, .p-placeholder, .p-dropdown-label', { timeout: 5000 })
      .should('contain.text', matchSubstring);

    // 8) small safety: ensure no panels remain open
    ensurePanelsClosed();
  }

  it('Opens modal and fills fields reliably', () => {
    // disable animations immediately
    disableAnimations();

    // Intercepts - add the main endpoints used by the modal. Adjust endpoints if your backend differs.
    cy.intercept('POST', '**/gen/find-many').as('findMany');
    cy.intercept('POST', '**/catalogs/get-catalogs').as('getCatalogs');
    // Keep user-related intercepts broad so we can capture the real URL in various environments
    cy.intercept('POST', '**/user/**').as('userPosts');
    cy.intercept('GET', '**/user/**').as('userGets');

    // Visit and login
    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]', { timeout: 10000 }).clear().type('admin');
    cy.get('input[type="password"]', { timeout: 10000 }).clear().type('sample', { log: false });

    // Use scoped click on the login form's submit button
    cy.get("button[type='button']", { timeout: 10000 }).click();

    cy.contains('Contractors', { timeout: 10000 }).should('be.visible').click();

    // open modal
    cy.get("div.w-full.flex.items-center.gap-2", { timeout: 10000 }).should('be.visible').click();

    // Wait for modal-related XHRs to finish (findMany/getCatalogs)
    cy.wait('@findMany', { timeout: 15000 });
    cy.wait('@getCatalogs', { timeout: 15000 });

    // Wait for the modal container and for the labels that indicate the form block is rendered.
    cy.get('p-dynamicdialog .p-dialog-content', { timeout: 10000 }).should('be.visible');

    // Wait specifically for STATUS and GENDER inputs to exist
    cy.get('input#status-active', { timeout: 10000 }).should('exist');
    cy.get('input#status-inactive', { timeout: 10000 }).should('exist');

    cy.get('input#genderCt-0, input#genderCt-1, input#genderCt-2', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .and('exist');

    
    
    
    
    
    
      // Fill text fields with asserts

    cy.get('#firstName').should('be.visible').clear()
      .type('CypressFirstName').should('have.value', 'CypressFirstName');
    cy.get('#lastName').should('be.visible').clear()
      .type('CypressLastName').should('have.value', 'CypressLastName');

    // Radios: use checkRadio helper
    checkRadio('input#status-active', 'status-active');
    checkRadio('input#genderCt-1', 'genderCt-1');

    // Preferred language select
    selectPrimeAndClose('preferredLanCt', 'English');

    // Ensure any dropdowns are closed before interacting with the next inputs
    ensurePanelsClosed();

    // other inputs
    cy.get('#officeEmail').clear().type('test@test.com').should('have.value', 'test@test.com');
    cy.get('#whatsapp').clear().type('1234567890').should('have.value', '1234567890');

    // Supervisor select - don't wait before clicking; the helper will wait for overlay and optional XHR
    selectPrimeAndClose('supervisor', 'Admin User', '@userPosts');

    // Country select (Bolivia)
    selectPrimeAndClose('countryCt', 'Bolivia');

    // Timezone select (stable substring)
    selectPrimeAndClose('timezoneCt', 'Bolivia/Atlantic Standard');

    // username
    cy.get('#username').clear().type('cypresstest').should('have.value', 'cypresstest');

    // PASSWORD (target the inner input)
    cy.get('#password').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    // CONFIRM PASSWORD (target the inner input)
    cy.get('#confirmPassword').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    // ADDRESS FIELD
    cy.get('#address').type('This is a test');

    // Personal Email
    cy.get('#email').clear().type('personal@test.com').should('have.value', 'personal@test.com');

    // Phone
    cy.get('#phone').type('1234567890');

    // Birth Date datepicker - set value by dispatching input/change events (Angular-friendly)

    cy.get("input[name='birthDate']").clear().type('20/Nov/1990');
    // Click the container at the bottom of the modal
    cy.get('.flex.flex-row.justify-end.gap-4.mt-4.ng-star-inserted')
      .click({ force: true });


    







        //CREATE BUTTON . last step
    cy.contains('button', 'Create New Contractor')
      .click({ force: true });
  });
});
