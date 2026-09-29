import { defineConfig, devices } from "@playwright/test";

// Start the production server with `npm run build && npm start` before testing.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "data-validation", testMatch: /.*\.unit\.spec\.ts/ },
    { name: "mobile-360", testIgnore: /.*\.unit\.spec\.ts/, use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 }, channel: "chrome" } },
    { name: "tablet", testIgnore: /.*\.unit\.spec\.ts/, use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: "desktop", testIgnore: /.*\.unit\.spec\.ts/, use: { viewport: { width: 1440, height: 1000 } } },
  ],
});
