// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  // Dossier contenant les fichiers de tests
  testDir: "./tests",

  // Timeout par test (10 secondes)
  timeout: 10_000,

  // Relance un test qui échoue une 2e fois avant de le marquer FAILED
  retries: 1,

  use: {
    // URL de base : tous les appels page.goto("/") utiliseront cette base
    baseURL: "http://127.0.0.1:5500",

    // Lance le navigateur sans interface graphique (plus rapide en CI/terminal)
    headless: true,

    // Capture une capture d'écran uniquement en cas d'échec
    screenshot: "only-on-failure",
  },

  // On teste uniquement sur Chromium pour ce lab
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
