import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = path.resolve(process.env.LIGHTHOUSE_OUTPUT_DIR || "artifacts/lighthouse");
const availableRoutes = [
  ...(process.env.LIGHTHOUSE_GUEST_PATH ? [{name:"guest",route:process.env.LIGHTHOUSE_GUEST_PATH}] : []),
  ...(process.env.LIGHTHOUSE_INVITE_PATH ? [{ name: "published", route: process.env.LIGHTHOUSE_INVITE_PATH }] : []),
  { name: "homepage", route: "/" },
  { name: "royal", route: "/demo?theme=royal" },
  { name: "modern", route: "/demo?theme=modern" },
  { name: "floral", route: "/demo?theme=floral" },
  ...["mehfil", "kesar", "lotus", "pichwai", "ocean", "champagne", "sindoor"].map((theme) => ({ name: theme, route: `/demo?theme=${theme}` })),
  { name: "templates", route: "/templates" },
  { name: "birthday", route: "/demo?occasion=birthday&theme=kesar" },
  { name: "remembrance", route: "/demo?occasion=remembrance&theme=modern" },
  { name: "customize", route: "/customize" },
];
const requestedRoutes = process.argv.slice(2);
const unknownRoutes = requestedRoutes.filter((name) => !availableRoutes.some((route) => route.name === name));
if (unknownRoutes.length) throw new Error(`Unknown route names: ${unknownRoutes.join(", ")}. Choose from ${availableRoutes.map((route) => route.name).join(", ")}.`);
const routes = requestedRoutes.length ? availableRoutes.filter((route) => requestedRoutes.includes(route.name)) : availableRoutes;
await mkdir(outputDirectory, { recursive: true });
const browser = await launch({
  chromePath: process.env.CHROME_PATH ?? (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined),
  chromeFlags: ["--headless=new", "--disable-gpu", "--no-first-run"],
});
const results = [];

try {
  for (const { name, route } of routes) {
    console.log(`Measuring ${name} on the local production server`);
    const result = await lighthouse(new URL(route, baseUrl).href, {
      port: browser.port,
      output: ["json", "html"],
      onlyCategories: ["performance", "accessibility"],
      formFactor: "mobile",
      // Applied DevTools mobile network/CPU throttling, not estimated scores.
      throttlingMethod: "devtools",
      logLevel: "error",
    });
    if (!result) throw new Error(`Lighthouse did not return a report for ${route}`);
    const reports = Array.isArray(result.report) ? result.report : [result.report];
    await writeFile(path.join(outputDirectory, `${name}.json`), reports[0]);
    await writeFile(path.join(outputDirectory, `${name}.html`), reports[1]);
    const { lhr } = result;
    const summary = {
      name,
      route: name === "guest" ? "/g/[local-fixture-token]" : route,
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      firstContentfulPaintMs: Math.round(lhr.audits["first-contentful-paint"].numericValue),
      largestContentfulPaintMs: Math.round(lhr.audits["largest-contentful-paint"].numericValue),
      totalBlockingTimeMs: Math.round(lhr.audits["total-blocking-time"].numericValue),
      cumulativeLayoutShift: lhr.audits["cumulative-layout-shift"].numericValue,
      totalTransferBytes: lhr.audits["total-byte-weight"].numericValue,
      javascriptTransferBytes: lhr.audits["resource-summary"].details.items.find(item => item.resourceType === "script")?.transferSize,
      imageTransferBytes: lhr.audits["resource-summary"].details.items.find(item => item.resourceType === "image")?.transferSize,
      throttling: lhr.configSettings.throttling,
      screenEmulation: lhr.configSettings.screenEmulation,
      environment: lhr.environment,
      lighthouseVersion: lhr.lighthouseVersion,
      measuredAt: lhr.fetchTime,
      failedAccessibilityAudits: Object.values(lhr.audits)
        .filter((audit) => lhr.categories.accessibility.auditRefs.some((reference) => reference.id === audit.id && reference.weight > 0) && audit.score !== null && audit.score < 1)
        .map((audit) => ({ id: audit.id, title: audit.title })),
    };
    results.push(summary);
    await writeFile(path.join(outputDirectory, requestedRoutes.length ? "summary-selected.json" : "summary.json"), `${JSON.stringify(results, null, 2)}\n`);
    console.log(JSON.stringify(summary));
  }
  if (requestedRoutes.length) {
    const previous = await readFile(path.join(outputDirectory, "summary.json"), "utf8").then(JSON.parse).catch(() => []);
    const merged = availableRoutes.map(({ route, name }) => results.find((result) => result.name === name || result.route === route) ?? previous.find((result) => result.route === route)).filter(Boolean);
    await writeFile(path.join(outputDirectory, "summary.json"), `${JSON.stringify(merged, null, 2)}\n`);
  }
  if (results.some((result) => result.performance < 90 || result.accessibility < 90 || result.cumulativeLayoutShift > 0.01)) {
    process.exitCode = 1;
  }
} finally {
  await browser.kill();
}
