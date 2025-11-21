// contractorTest.stable.cy.js
// Stable, defensive Cypress E2E test for the "Create Contractor" modal.
// Debug screenshots (local filesystem):
// - Modal network/debug: /mnt/data/c11e75fb-3a43-42d3-bfd6-0a840af7d5f7.png
// - Overlay cover error: /mnt/data/a1f5c531-eac1-47a9-aeec-d278f62b3a45.png

// NOTE: This spec is deliberately defensive:
// - waits for XHRs where appropriate,
// - opens dropdown triggers before waiting for their panels,
// - ensures overlays/panels are closed before interacting with inputs,
// - contains retries/timeouts for slow or flaky environments.

describe('Contractor Management Test (stable)', () => {
  // Small helper: strip CSS transitions/animations so Cypress interactions don't race with visuals.
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

  // Ensure common overlay panels are closed before proceeding.
  // Strategy: click a safe neutral spot (top-left), wait briefly, and re-check known panel selectors.
  function ensurePanelsClosed() {
    // Click a neutral coordinate on <body> to dismiss overlays.
    cy.get('body').then($b => {
      cy.get('body').click(10, 10, { force: true });
    });
    // Small pause to let DOM/layout update (safety net for animations/async closures).
    cy.wait(100);
    // If any expected overlay panels are still visible, click neutral spot again.
    cy.get('body').then($body => {
      const visiblePanel = $body.find('.p-dropdown-panel:visible, .p-multiselect-panel:visible, .p-overlaypanel:visible, #preferredLanCt_list:visible').length;
      if (visiblePanel) {
        cy.get('body').click(10, 10, { force: true });
        cy.wait(100);
      }
    });
  }

  // Robust radio-check helper:
  // - If the <input> is visible, check it directly.
  // - If the input is hidden, click its <label> (for="...") and then assert checked.
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
   *
   * Parameters:
   * - selectId: id of the component wrapper (without '#')
   * - matchSubstring: partial text to match an option (case-sensitive substring)
   * - optXhrAlias: optional Cypress XHR alias to wait for after opening the dropdown
   *
   * Behavior:
   * 1) Clicks the dropdown trigger (handles lazy triggers).
   * 2) Optionally waits for a provided XHR (useful if options are fetched on open).
   * 3) Finds the visible overlay/panel appended to body.
   * 4) Locates an option by substring and clicks it.
   * 5) Clicks a neutral element to collapse the panel and asserts the wrapper displays the chosen value.
   * 6) Calls ensurePanelsClosed() as a final safety step.
   */
  function selectPrimeAndClose(selectId, matchSubstring, optXhrAlias = null) {
    const wrapper = `#${selectId}`;
    const triggerSel = `${wrapper} div[role="button"], ${wrapper} .p-dropdown-trigger, ${wrapper} .p-multiselect-label-container, ${wrapper} .p-component.p-iconwrapper`;

    // 1) Click the trigger (retry until actionable)
    cy.get(triggerSel, { timeout: 15000 })
      .first()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    // 2) Wait for XHR if caller provided an alias (some selects lazy-load data).
    if (optXhrAlias) {
      cy.wait(optXhrAlias, { timeout: 20000 }).its('response.statusCode')
      .should('be.oneOf', [200, 201, 204]);
    }

    // 3) Known possible panel/container selectors appended to body.
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

    // 4) Resolve a visible panel alias (@activePanel) for subsequent operations.
    cy.get('body', { timeout: 15000 }).then($body => {
      const found = $body.find(panelSelector).filter(':visible').first();
      if (!found || found.length === 0) {
        // Wait for a known panel to appear and alias it.
        cy.get(panelSelector, { timeout: 15000 }).filter(':visible').first().as('activePanel');
      } else {
        cy.wrap(found).as('activePanel');
      }
    });

    // 5) Inside the active panel: ensure options exist, find by substring and click.
    cy.get('@activePanel', { timeout: 15000 }).should('be.visible').within(() => {
      cy.get('li[role="option"], .p-dropdown-item, .p-selectitem', { timeout: 15000 })
        .should('have.length.greaterThan', 0);

      cy.contains('li[role="option"], .p-dropdown-item, .p-selectitem', matchSubstring, { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });

    // 6) Collapse panel by clicking a neutral, visible field inside the modal.
    cy.get('#firstName', { timeout: 5000 }).should('be.visible').click();

    // 7) Verify the wrapper shows the selected text (label/placeholder).
    cy.get(wrapper).find('.p-select-label, .p-multiselect-label, .p-placeholder, .p-dropdown-label', { timeout: 5000 })
      .should('contain.text', matchSubstring);

    // 8) Final safety: ensure no panels remain open.
    ensurePanelsClosed();
  }

  it('Opens modal and fills fields reliably', () => {
    // Disable animations before interacting with the UI.
    disableAnimations();

    // Intercepts: main endpoints used by the modal (broad matching to survive env differences).
    cy.intercept('POST', '**/gen/find-many').as('findMany');
    cy.intercept('POST', '**/catalogs/get-catalogs').as('getCatalogs');
    cy.intercept('POST', '**/user/**').as('userPosts');
    cy.intercept('GET', '**/user/**').as('userGets');

    // Visit application and log in.
    cy.visit('http://154.38.173.164:6980');

    cy.get('input[name="username"]', { timeout: 10000 }).clear().type('admin');
    cy.get('input[type="password"]', { timeout: 10000 }).clear().type('sample', { log: false });

    // Click the login form submit button (scoped selector).
    cy.get("button[type='button']", { timeout: 10000 }).click();

    // Navigate to the Contractors section.
    cy.contains('Contractors', { timeout: 10000 }).should('be.visible').click();

    // Open the "Create Contractor" modal.
    cy.get("div.w-full.flex.items-center.gap-2", { timeout: 10000 }).should('be.visible').click();

    // Wait for modal-related network calls to complete.
    cy.wait('@findMany', { timeout: 15000 });
    cy.wait('@getCatalogs', { timeout: 15000 });

    // Ensure the modal content is rendered before interacting.
    cy.get('p-dynamicdialog .p-dialog-content', { timeout: 10000 }).should('be.visible');

    // Wait for critical form controls (STATUS and GENDER radios) to exist.
    cy.get('input#status-active', { timeout: 10000 }).should('exist');
    cy.get('input#status-inactive', { timeout: 10000 }).should('exist');

    cy.get('input#genderCt-0, input#genderCt-1, input#genderCt-2', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .and('exist');

    // Fill simple text fields and assert values.
    cy.get('#firstName').should('be.visible').clear()
      .type('CypressFirstName').should('have.value', 'CypressFirstName');
    cy.get('#lastName').should('be.visible').clear()
      .type('CypressLastName').should('have.value', 'CypressLastName');

    // Radios: use the helper to check them reliably.
    checkRadio('input#status-active', 'status-active');
    checkRadio('input#genderCt-1', 'genderCt-1');

    // Preferred language select (PrimeNG) — selects "English".
    selectPrimeAndClose('preferredLanCt', 'English');

    // Make sure dropdowns/panels are closed before next interactions.
    ensurePanelsClosed();

    // Additional contact inputs.
    cy.get('#officeEmail').clear().type('test@test.com').should('have.value', 'test@test.com');
    cy.get('#whatsapp').clear().type('1234567890').should('have.value', '1234567890');

    // Supervisor select: helper will wait for overlay and optional XHR.
    selectPrimeAndClose('supervisor', 'Admin User', '@userPosts');

    // Country select — pick "Bolivia".
    selectPrimeAndClose('countryCt', 'Bolivia');

    // Timezone select — choose the stable substring match.
    selectPrimeAndClose('timezoneCt', 'Bolivia/Atlantic Standard');

    // Username/password fields.
    cy.get('#username').clear().type('cypresstest').should('have.value', 'cypresstest');

    // Password (inner input) — assert type is password then type value.
    cy.get('#password').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    // Confirm password (inner input).
    cy.get('#confirmPassword').find('input').should('be.visible').and('have.attr', 'type', 'password')
      .type('Sample123.');

    // Address and personal contact fields.
    cy.get('#address').type('This is a test');
    cy.get('#email').clear().type('personal@test.com').should('have.value', 'personal@test.com');
    cy.get('#phone').type('1234567890');

    // Birthdate: set value directly (Angular-friendly input change).
    cy.get("input[name='birthDate']").clear().type('20/Nov/1990');

    // Click the modal's footer area (neutral area) to ensure focus/closure of panels.
    cy.get('.flex.flex-row.justify-end.gap-4.mt-4.ng-star-inserted')
      .click({ force: true });

    // FINAL STEP: click the create button to submit the form.
    cy.contains('button', 'Create New Contractor')
      .click({ force: true });
  });
});
