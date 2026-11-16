import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node dist/index.js",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "mtti-e2e-jwt-secret-verification-key-2026-secure",
      DOCUMENT_SIGNING_SECRET: "mtti-doc-signer-secret-key-2026-production",
      PORT: "3000",
      ALLOW_DEMO_AUTH: "true",
    },
  },
});
