import { defineConfig } from '@playwright/test';

// BrowserStack Playwright config
// Usage: npm run e2e:browserstack
//
// Required env vars:
//   BROWSERSTACK_USERNAME - Your BrowserStack username
//   BROWSERSTACK_ACCESS_KEY - Your BrowserStack access key
//
// Make sure BrowserStack Local is running or set browserstackLocal: true in browserstack.config.json

function bsCaps(browser: string, os: string, osVersion: string, name: string) {
  return {
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
        JSON.stringify({
          browser,
          os,
          os_version: osVersion,
          'browserstack.username': process.env.BROWSERSTACK_USERNAME,
          'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
          project: 'ggLobby',
          build: `ggLobby-${new Date().toISOString().split('T')[0]}`,
          name,
          'browserstack.local': 'true',
          'browserstack.debug': 'true',
          'browserstack.networkLogs': 'true',
        })
      )}`,
    },
  };
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Auth setup
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // BrowserStack browsers
    {
      name: 'bs-chrome-win11',
      use: bsCaps('chrome', 'Windows', '11', 'Chrome Win11'),
      dependencies: ['setup'],
    },
    {
      name: 'bs-firefox-win11',
      use: bsCaps('playwright-firefox', 'Windows', '11', 'Firefox Win11'),
      dependencies: ['setup'],
    },
    {
      name: 'bs-edge-win11',
      use: bsCaps('edge', 'Windows', '11', 'Edge Win11'),
      dependencies: ['setup'],
    },
    {
      name: 'bs-safari-ventura',
      use: bsCaps('playwright-webkit', 'OS X', 'Ventura', 'Safari Ventura'),
      dependencies: ['setup'],
    },
  ],
  // No webServer - BrowserStack connects to your running local server via BrowserStack Local
});
