import 'cypress-file-upload';

describe('Create My Timecard - Bulk Event Creation', () => {

  // Helper: Get Monday of the week
  const getMondayOfWeek = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  // Helper: Calculate weeks difference
  const getWeeksDifference = (currentMondayStr, targetMondayStr) => {
    const current = new Date(currentMondayStr);
    const target = new Date(targetMondayStr);
    const diffTime = target.getTime() - current.getTime();
    return Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  };

  // Helper: Subtract minutes
  const subtractMinutes = (timeStr, minsToSubtract) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() - minsToSubtract);
    const newH = String(date.getHours()).padStart(2, '0');
    const newM = String(date.getMinutes()).padStart(2, '0');
    return `${newH}:${newM}`;
  };

  // Helper: Calculate duration string
  const calculateDuration = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  before(() => {
    // 1. Visit and Login ONCE
    cy.visit('http://154.38.173.164:6980');
    cy.get('input[name="username"]', { timeout: 10000 }).clear().type('atreus');
    cy.get('input[type="password"]', { timeout: 10000 }).clear().type('Sample123.', { log: false });
    cy.get("button[type='button']").click();
    cy.contains('My Timecard', { timeout: 15000 }).should('be.visible').click();
    cy.get('.fc-timegrid-body', { timeout: 15000 }).should('be.visible');
  });

  it('should create multiple events from JSON fixture', () => {
    cy.viewport(1920, 1080);

    // Load Fixture
    cy.fixture('timecard_entries').then((entries) => {
      entries.forEach((entry, index) => {
        cy.log(`PROCESSING ENTRY ${index + 1}: ${entry.date} ${entry.startTime}-${entry.endTime}`);

        const targetDate = entry.date;
        const startTime = entry.startTime + ':00';
        const dragEndTime = subtractMinutes(entry.endTime, 15) + ':00';
        const durationStr = calculateDuration(entry.startTime, entry.endTime);

        // ============================================================
        // 1. NAVIGATION
        // ============================================================
        cy.get('th[role="columnheader"][data-date]').first().invoke('attr', 'data-date').then((currentDateStr) => {
          const currentMonday = getMondayOfWeek(currentDateStr);
          const targetMonday = getMondayOfWeek(targetDate);
          const weeksDiff = getWeeksDifference(currentMonday, targetMonday);

          if (weeksDiff !== 0) {
            const chevronDirection = weeksDiff > 0 ? 'chevron_right' : 'chevron_left';
            const clickCount = Math.abs(weeksDiff);
            for (let i = 0; i < clickCount; i++) {
              cy.contains('span.material-symbols-outlined', chevronDirection).click();
              cy.wait(500);
            }
            cy.wait(1000); // Settle
          }
        });

        // Verify target date
        cy.get(`.fc-timegrid-col[data-date="${targetDate}"]`, { timeout: 10000 }).should('exist');

        // ============================================================
        // 2. DRAG INTERACTION (Absolute Top-Edge Strategy)
        // ============================================================
        cy.get(`.fc-timegrid-col[data-date="${targetDate}"]`).then($col => {
          const colRect = $col[0].getBoundingClientRect();
          const colAbsCenterX = colRect.left + (colRect.width / 2);

          // Scroll buffer time (1 hr before) to ensure start is fully visible and not under header
          const scrollTargetTime = subtractMinutes(entry.startTime, 60) + ':00';
          cy.get(`td.fc-timegrid-slot-lane[data-time="${scrollTargetTime}"]`)
            .should('exist')
            .scrollIntoView({ block: 'center' })
            .should('be.visible');

          cy.get(`td.fc-timegrid-slot-lane[data-time="${startTime}"]`).should('be.visible').then($start => {
            cy.get(`td.fc-timegrid-slot-lane[data-time="${dragEndTime}"]`).should('be.visible').then($end => {

              cy.log(`ELEMENT DRAG: From ${startTime} to ${dragEndTime}`);

              // Trigger mousedown on START SLOT
              cy.wrap($start)
                .trigger('mousedown', {
                  button: 0,
                  buttons: 1,
                  which: 1, // Important for some listeners
                  force: true,
                  view: window
                })
                .wait(300);

              // Trigger mousemove on END SLOT
              cy.wrap($end)
                .trigger('mousemove', {
                  button: 0,
                  buttons: 1,
                  which: 1,
                  force: true,
                  view: window
                })
                .wait(300)
                .trigger('mouseup', {
                  button: 0,
                  buttons: 0,
                  which: 1,
                  force: true,
                  view: window
                });
            });
          });
        });

        // ============================================================
        // 3. FILL MODAL
        // ============================================================
        cy.get('.p-dialog', { timeout: 15000 }).within(() => {
          cy.contains('Add Work Hours').should('be.visible');
          cy.contains(entry.startTime).should('exist');
          cy.contains(durationStr).should('exist');

          // Work Type
          cy.contains('label', entry.workType).should('be.visible').click();

          // Project (Conditional)
          if (entry.workType === 'Project' && entry.project) {
            cy.get('#projectId').should('be.visible').click();
          }
        });

        // Handle Project Dropdown (Outside)
        if (entry.workType === 'Project' && entry.project) {
          cy.get('ul[role="listbox"], .p-dropdown-items-wrapper, #projectId_list')
            .should('be.visible')
            .contains('li', entry.project)
            .click();
        }

        cy.get('.p-dialog').within(() => {
          // Task Type
          cy.contains('label', entry.taskType).scrollIntoView().should('be.visible').click();

          // Description
          cy.get('#description').clear().type(entry.description);
        });

        // Save
        cy.contains('button', 'Save Hours').scrollIntoView().should('be.visible').click();
        cy.wait(2000);
      });
    });
  });
});