
import neatCSV from 'neat-csv';
import 'cypress-file-upload';
import 'cypress-real-events';

describe('Create My Timecard - Multi-Contractor Bulk Event Creation', () => {

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

  // Helper: Login with credentials
  const login = (username, password) => {
    cy.visit('http://154.38.173.164:6980');
    cy.get('input[name="username"]', { timeout: 10000 }).clear().type(username);
    cy.get('input[type="password"]', { timeout: 10000 }).clear().type(password, { log: false });
    cy.get("button[type='button']").click();
    cy.contains('My Timecard', { timeout: 15000 }).should('be.visible').click();
    cy.get('.fc-timegrid-body', { timeout: 15000 }).should('be.visible');
    cy.wait(3000); // Wait for initial data load (projects, etc.)
  };

  // Helper: Logout
  const logout = () => {
    // Click on the red logout button/link
    cy.get('a.bg-red-600', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1000);
    // Verify we're back at login page
    cy.get('input[name="username"]', { timeout: 10000 }).should('be.visible');
  };

  // Helper: Process a single timecard entry
  const processEntry = (entry) => {
    const targetDate = entry.date;
    // Fix: Ensure startTime is strictly HH:mm:00 (zero-padded) for data-time matching
    const [sH, sM] = entry.startTime.split(':');
    const startTime = `${sH.padStart(2, '0')}:${sM.padStart(2, '0')}:00`;

    // Calculate drag end time (assumes logic correctness from provided script)
    const dragEndTime = subtractMinutes(entry.endTime, 15) + ':00';
    const durationStr = calculateDuration(entry.startTime, entry.endTime);

    // Calculate scroll target time (1 hour before start time)
    const scrollTime = subtractMinutes(entry.startTime, 60) + ':00';

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

    // Verify target date column exists
    cy.get(`.fc-timegrid-col[data-date="${targetDate}"]`, { timeout: 10000 }).should('exist');

    // Reset mouse position and focus to prevent interference from previous events
    cy.get('body').realMouseMove(0, 0).click({ force: true });
    cy.wait(500);

    // ============================================================
    // 2. DRAG INTERACTION (Using cypress-real-events)
    // ============================================================
    // Scroll a time slot 1 hour BEFORE the actual start time into view to avoid header obstruction
    cy.get(`td.fc-timegrid-slot-lane[data-time="${scrollTime}"]`)
      .scrollIntoView({ block: 'center' })
      .should('be.visible');

    cy.wait(500); // Allow scroll to settle

    // Get the intersection cell using INDEX matching (Header -> Body Column)
    cy.log(`TARGET DATE FOR DRAG: ${targetDate}`);

    // Find the header index for the target date
    cy.get(`th[role="columnheader"].fc-col-header-cell`).then($headers => {
      // Find index of header with matching data-date
      let targetIndex = -1;
      $headers.each((i, el) => {
        if (Cypress.$(el).attr('data-date') === targetDate) {
          targetIndex = i;
          return false; // break
        }
      });

      if (targetIndex === -1) {
        throw new Error(`Could not find column header for date ${targetDate}`);
      }

      // Now get the corresponding body column by index
      cy.get(`.fc-timegrid-col:not(.fc-timegrid-axis)`).eq(targetIndex).then($col => {
        const colRect = $col[0].getBoundingClientRect();
        const colX = colRect.left + 20;
        cy.log(`COLUMN FOUND (b Index ${targetIndex}): data-date=${$col.attr('data-date')}, colX=${colX}`);

        // Get start and end time slots
        cy.get(`td.fc-timegrid-slot-lane[data-time="${startTime}"]`).then($startSlot => {
          cy.get(`td.fc-timegrid-slot-lane[data-time="${dragEndTime}"]`).then($endSlot => {
            const startRect = $startSlot[0].getBoundingClientRect();
            const endRect = $endSlot[0].getBoundingClientRect();

            const startY = startRect.top + (startRect.height / 2);
            const endY = endRect.top + (endRect.height / 2);

            cy.log(`REAL EVENTS DRAG: X=${colX}, StartY=${startY}, EndY=${endY}`);

            cy.get('body')
              .realMouseDown({ x: colX, y: startY, button: 'left' })
              .realMouseMove(colX, endY, { position: 'topLeft' })
              .realMouseUp({ x: colX, y: endY, button: 'left' });
          });
        });
      });

      cy.wait(1500);

      // ============================================================
      // 3. FILL MODAL
      // ============================================================
      cy.get('.p-dialog', { timeout: 20000 }).should('exist').should('be.visible');

      cy.get('.p-dialog').within(() => {
        cy.contains('Add Work Hours').should('be.visible');

        const dateObj = new Date(entry.date + 'T12:00:00');
        const expectedDay = dateObj.getDate();
        const expectedYear = dateObj.getFullYear();

        cy.get('.p-dialog-content').invoke('text').then((text) => {
          if (!text.includes(expectedYear)) {
            cy.get('.p-dialog-header').invoke('text').then(headerText => {
              cy.log(`MODAL HEADER: ${headerText}`);
              expect(headerText).to.contain(expectedDay);
              expect(headerText).to.contain(expectedYear);
            });
          } else {
            cy.log(`MODAL CONTENT: ${text}`);
            expect(text).to.contain(expectedDay);
            expect(text).to.contain(expectedYear);
          }
        });

        cy.wait(2000); // Wait for modal content (radio buttons, dropdowns) to load

        cy.contains(entry.startTime).should('exist');
        cy.contains(durationStr).should('exist');

        cy.contains('label', entry.workType).should('be.visible').click();
        cy.wait(2000);

        if (entry.workType === 'Project' && entry.project) {
          cy.get('#projectId').should('be.visible').click();
        }
      });

      if (entry.workType === 'Project' && entry.project) {
        cy.get('ul[role="listbox"], .p-dropdown-items-wrapper, #projectId_list')
          .should('be.visible')
          .contains('li', entry.project)
          .click();

        // Robustly close the dropdown overlay
        cy.get('body').type('{esc}');
        cy.get('.p-select-overlay, .p-dropdown-panel, ul[role="listbox"]').should('not.exist');
        cy.wait(500);
      }

      cy.get('.p-dialog').within(() => {
        // Click on modal title as a fallback to ensure dropdown/popups are closed
        cy.get('.p-dialog-title').click({ force: true });
        cy.wait(500);

        // Task Type
        cy.contains('label', entry.taskType).scrollIntoView().should('be.visible').click();
        cy.get('#description').clear().type(entry.description);
      });

      cy.contains('button', 'Save Hours').scrollIntoView().should('be.visible').click();
      cy.get('.p-dialog', { timeout: 20000 }).should('not.exist');
      cy.wait(2000); // Longer settle time
    });
  };

  // Helper: Process all entries for a contractor
  const processContractor = (contractor, isLastContractor) => {
    cy.log(`========================================`);
    cy.log(`CONTRACTOR: ${contractor.username}`);
    cy.log(`========================================`);

    login(contractor.username, contractor.password);

    // Process each entry sequentially
    cy.wrap(contractor.entries).each((entry, entryIndex) => {
      cy.log(`ENTRY ${entryIndex + 1}: ${entry.date} ${entry.startTime}-${entry.endTime}`);
      processEntry(entry);
    });

    // Logout if not the last contractor
    if (!isLastContractor) {
      cy.log(`Logging out ${contractor.username}...`);
      logout();
    }
  };

  // Helper: Transform flat CSV data to hierarchical contractors structure
  const transformToContractors = (flatData) => {
    const contractorsMap = {};

    flatData.forEach(row => {
      // Skip empty rows if any
      if (!row.username) return;

      if (!contractorsMap[row.username]) {
        contractorsMap[row.username] = {
          username: row.username,
          password: row.password,
          entries: []
        };
      }

      const newEntry = {
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        workType: row.workType,
        project: row.project,
        taskType: row.taskType,
        description: row.description
      };

      contractorsMap[row.username].entries.push(newEntry);
    });

    return Object.values(contractorsMap);
  };

  it('should create timecard events for multiple contractors from CSV fixture', () => {
    cy.viewport(1920, 1080);

    // Read CSV file using standard Cypress fixture and neat-csv
    cy.fixture('timecard_entries.csv')
      .then(neatCSV)
      .then((flatData) => {
        const contractors = transformToContractors(flatData);

        // Process each contractor sequentially
        cy.wrap(contractors).each((contractor, contractorIndex) => {
          const isLastContractor = contractorIndex === contractors.length - 1;
          processContractor(contractor, isLastContractor);
        });
      });
  });
});
