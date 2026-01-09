const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // 1. Set the resolution for all tests here
  viewportWidth: 1920,
  viewportHeight: 1080,

  e2e: {
    experimentalStudio: true,   // 👈 enable Cypress Studio

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
