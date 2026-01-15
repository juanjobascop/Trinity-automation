/**
 * Bulk Timecard Creation via API
 * 
 * This script creates timecard entries using direct API calls instead of UI automation.
 * Much faster than UI-based approach.
 * 
 * Flow:
 * 1. For each contractor, login to get their token and userId
 * 2. POST to /gen/insert for each timecard entry using contractor's token
 * 
 * Usage:
 *   npx cypress run --spec "cypress/e2e/Bulk/bulkTimecardsAPI.cy.js"
 *   
 * Resume from specific contractor/row:
 *   npx cypress run --spec "cypress/e2e/Bulk/bulkTimecardsAPI.cy.js" --env START_CONTRACTOR=Omar,START_ROW=50
 */

import neatCSV from 'neat-csv';

describe('Bulk Timecard Creation via API', () => {
  const API_BASE = 'https://trinity2-qa-backend.tutatordev.com';
  const HEADERS = {
    'Referer': 'https://trinity2-qa-frontend.tutatordev.com',
    'Origin': 'https://trinity2-qa-frontend.tutatordev.com',
    'Content-Type': 'application/json'
  };

  // Cache for contractor credentials (token + userId)
  const contractorCache = {};

  /**
   * Login and get token + userId
   */
  const loginContractor = (username, password) => {
    if (contractorCache[username]) {
      return cy.wrap(contractorCache[username]);
    }

    return cy.request({
      method: 'POST',
      url: `${API_BASE}/user/login`,
      headers: HEADERS,
      body: { username, password },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      const body = response.body;

      // Extract token and userId from response
      const token = body.token;
      const userId = body.userId || body.id || body.user?.id;

      if (!token) {
        throw new Error(`Could not extract token from login response for ${username}`);
      }
      if (!userId) {
        throw new Error(`Could not extract userId from login response for ${username}. Response: ${JSON.stringify(body)}`);
      }

      contractorCache[username] = { token, userId };
      cy.log(`Contractor ${username} logged in. userId: ${userId}`);
      return cy.wrap(contractorCache[username]);
    });
  };

  /**
   * Helper to adjust time by adding hours (to fix timezone issues)
   */
  const adjustTime = (isoString, hoursToAdd = 4) => {
    if (!isoString) return isoString;
    const date = new Date(isoString);
    date.setHours(date.getHours() + hoursToAdd);
    return date.toISOString();
  };

  /**
   * Create a single timecard entry via API
   */
  const createTimecardEntry = (entry, token, userId) => {
    // Build the payload with correct structure
    const payload = {
      model: 'tri_timecard',
      data: {
        statusCt: '1',
        workTypeCt: String(entry.workTypeCt),
        projectId: entry.projectId || null,
        typeTaskCt: String(entry.typeTaskCt),
        description: entry.description,
        date: entry.date,
        start: adjustTime(entry.start),
        end: adjustTime(entry.end),
        hours: String(entry.hours),
        userId: userId
      },
      userId: userId
    };

    cy.log(`Creating timecard: ${entry.date} ${entry.startTime}-${entry.endTime}`);

    return cy.request({
      method: 'POST',
      url: `${API_BASE}/gen/insert`,
      headers: {
        ...HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: payload,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status !== 200 && response.status !== 201) {
        cy.log(`ERROR Status: ${response.status}`);
        cy.log(`ERROR Body: ${JSON.stringify(response.body)}`);
        cy.log(`Request Payload was: ${JSON.stringify(payload)}`);
        throw new Error(`API call failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      cy.log(`SUCCESS: Timecard created for ${entry.date}`);
    });
  };

  /**
   * Transform flat CSV data to hierarchical contractors structure
   */
  const transformToContractors = (flatData) => {
    const contractorsMap = {};

    flatData.forEach(row => {
      if (!row.username) return;

      if (!contractorsMap[row.username]) {
        contractorsMap[row.username] = {
          username: row.username,
          password: row.password,
          entries: []
        };
      }

      contractorsMap[row.username].entries.push({
        workTypeCt: row.workTypeCt,
        projectId: row.projectId,
        typeTaskCt: row.typeTaskCt,
        description: row.description,
        date: row.date,
        start: row.start,
        startTime: row.startTime,
        end: row.end,
        endTime: row.endTime,
        hours: row.hours
      });
    });

    return Object.values(contractorsMap);
  };

  /**
   * Process all entries for a single contractor
   */
  const processContractor = (contractor, startRow = 0) => {
    cy.log(`========================================`);
    cy.log(`CONTRACTOR: ${contractor.username} (${contractor.entries.length} entries, starting from row ${startRow})`);
    cy.log(`========================================`);

    return loginContractor(contractor.username, contractor.password).then((credentials) => {
      const { token, userId } = credentials;

      // Process entries sequentially starting from startRow
      const entriesToProcess = contractor.entries.slice(startRow);

      return cy.wrap(entriesToProcess).each((entry, index) => {
        const actualIndex = startRow + index;
        cy.log(`Entry ${actualIndex + 1}/${contractor.entries.length}: ${entry.date} ${entry.startTime}-${entry.endTime}`);
        createTimecardEntry(entry, token, userId);
      });
    });
  };

  it('should create timecard entries for all contractors via API', () => {
    // Resume capability
    const startContractor = Cypress.env('START_CONTRACTOR') || null;
    const startRow = parseInt(Cypress.env('START_ROW') || '0', 10);

    // Read and process CSV
    cy.fixture('timecard_entries.csv')
      .then(neatCSV)
      .then((flatData) => {
        const contractors = transformToContractors(flatData);
        cy.log(`Found ${contractors.length} contractors with ${flatData.length} total entries`);

        // Find starting contractor index
        let startContractorIndex = 0;
        if (startContractor) {
          const idx = contractors.findIndex(c => c.username === startContractor);
          if (idx !== -1) startContractorIndex = idx;
        }

        // Process contractors sequentially
        cy.wrap(contractors.slice(startContractorIndex)).each((contractor, idx) => {
          const rowOffset = (idx === 0) ? startRow : 0;
          processContractor(contractor, rowOffset);
        });
      });
  });
});