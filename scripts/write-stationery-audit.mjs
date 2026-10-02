import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts/stationery-audit');
const exists = file => access(path.join(root, file)).then(() => true, () => false);
const readJson = async file => {
  try { return JSON.parse(await readFile(path.join(root, file), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const relative = file => path.relative(output, path.join(root, file)).split(path.sep).join('/');
const number = (value, digits = 0) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
const kib = value => typeof value === 'number' && Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KiB` : '—';
const widths = [
  { width: 320, height: 740, project: 'mobile-320' },
  { width: 360, height: 800, project: 'mobile-360' },
  { width: 390, height: 844, project: 'mobile-390' },
  { width: 768, height: 1024, project: 'tablet' },
  { width: 1440, height: 1000, project: 'desktop' },
];

const summaryFile = 'artifacts/stationery-lighthouse/summary.json';
const rawReportFile = 'artifacts/stationery-lighthouse/homepage.html';
const provenanceFile = 'assets/source/homepage-marigold-prompt.json';
const [summary, provenance, beforeCapture, verification] = await Promise.all([
  readJson(summaryFile), readJson(provenanceFile), readJson('artifacts/stationery-before/capture.json'), readJson('artifacts/stationery-verification.json'),
]);
const measurements = Array.isArray(summary) ? summary : summary ? [summary] : [];
const homepage = measurements.find(item => item.name === 'homepage' || item.route === '/');
const measuredRows = measurements.map(item => `<tr><th>${escape(item.name === 'homepage' ? 'Homepage /' : 'Published invite /i/invitly-local-preview')}</th><td>${number(item.performance)}</td><td>${number(item.accessibility)}</td><td>${number(item.largestContentfulPaintMs)} ms</td><td>${number(item.cumulativeLayoutShift, 3)}</td><td>${kib(item.totalTransferBytes)}</td><td>${kib(item.javascriptTransferBytes)}</td><td>${kib(item.imageTransferBytes)}</td></tr>`).join('');

async function fileLink(file, label) {
  return await exists(file) ? `<a href="${relative(file)}">${escape(label)}</a>` : `<span class="pending">${escape(label)} · pending</span>`;
}

async function picture(file, label) {
  if (!await exists(file)) return `<figure class="missing"><p>Capture pending</p><figcaption>${escape(label)}</figcaption></figure>`;
  const url = relative(file);
  return `<figure><a href="${url}"><img src="${url}" alt="${escape(label)}" loading="lazy"></a><figcaption>${escape(label)} · open full capture</figcaption></figure>`;
}

async function comparison({ width, project }, className = '') {
  return `<div class="pair ${className}">${await picture(`artifacts/stationery-before/homepage-viewport-${width}.png`, `Before · homepage at ${width}px`)}${await picture(`artifacts/stationery-after/homepage-viewport-${project}.png`, `After · homepage at ${width}px`)}</div>`;
}

const captureRows = await Promise.all(widths.map(async item => `<tr><th>${item.width} × ${item.height}</th><td>${await fileLink(`artifacts/stationery-before/homepage-viewport-${item.width}.png`, 'Before')}</td><td>${await fileLink(`artifacts/stationery-after/homepage-viewport-${item.project}.png`, 'After')}</td><td>${await fileLink(`artifacts/stationery-after/hero-${item.project}.png`, 'Hero')}</td><td>${await fileLink(`artifacts/stationery-after/occasions-${item.project}.png`, 'Occasions')}</td></tr>`));
const capturedWidths = [];
for (const item of widths) if (await exists(`artifacts/stationery-after/homepage-viewport-${item.project}.png`)) capturedWidths.push(item.width);

let performance = '<p class="notice">Fresh Lighthouse results are not available yet. No estimated scores are shown. Run this generator again after the homepage measurement completes.</p>';
if (homepage) {
  const screen = homepage.screenEmulation || {};
  const throttle = homepage.throttling || {};
  const targetsKnown = Number.isFinite(homepage.performance) && Number.isFinite(homepage.accessibility);
  const status = targetsKnown ? homepage.performance >= 90 && homepage.accessibility >= 90 ? 'The measured Performance and Accessibility scores meet the ≥90 targets.' : 'At least one measured score is below the ≥90 target. Inspect the raw report before considering performance verification complete.' : 'Some metrics are unavailable; consult the raw report.';
  const failures = Array.isArray(homepage.failedAccessibilityAudits) && homepage.failedAccessibilityAudits.length
    ? `<p>Accessibility findings in this run:</p><ul>${homepage.failedAccessibilityAudits.map(item => `<li>${escape(item.title)} <code>${escape(item.id)}</code></li>`).join('')}</ul>` : '';
  performance = `<div class="table-scroll"><table><thead><tr><th>Page</th><th>Performance</th><th>Accessibility</th><th>LCP</th><th>CLS</th><th>Total transfer</th><th>JavaScript</th><th>Images</th></tr></thead><tbody>${measuredRows}</tbody></table></div>
    <p>${status}</p><p>Lighthouse ${escape(homepage.lighthouseVersion || 'version not recorded')} · measured ${escape(homepage.measuredAt || 'timestamp not recorded')}. Applied DevTools throttling: ${number(throttle.cpuSlowdownMultiplier, 1)}× CPU slowdown, ${number(throttle.requestLatencyMs, 1)} ms request latency, ${number(throttle.downloadThroughputKbps, 2)} Kbps down / ${number(throttle.uploadThroughputKbps, 2)} Kbps up. Browser mobile emulation: ${number(screen.width)} × ${number(screen.height)}, DPR ${number(screen.deviceScaleFactor, 2)}.</p>${failures}`;
}

const generatedAt = new Date().toISOString();
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Invitly · Stationery homepage before and after</title><style>
*{box-sizing:border-box}body{margin:0;background:#faf7ef;color:#3d3028;font:16px/1.75 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:42px 28px}header,section{padding:18px 0 42px;border-bottom:1px solid #dbcdb9}h1,h2,h3{font:400 38px/1.15 Georgia,serif;letter-spacing:-.035em}h1{font-size:clamp(40px,6vw,70px);max-width:860px}h2{font-size:32px}h3{font-size:24px}p{max-width:960px;color:#6b594a}a{color:#793d43;text-underline-offset:4px}nav{display:flex;gap:12px 28px;flex-wrap:wrap}nav a{min-height:44px;display:inline-flex;align-items:center}.eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#8a5e41}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px}figure{margin:0;padding:12px;background:#eee4d5;border:1px solid #d7c4ad;border-radius:10px;min-width:0}figure img{display:block;width:100%;height:auto}figcaption{font-size:12px;color:#735f4e;margin-top:10px}.pair-mobile{max-width:810px}.pair-mobile figure{max-width:390px}.missing{min-height:180px;display:grid;align-content:center;text-align:center}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:13px 12px;text-align:left;border-bottom:1px solid #ddcebc;vertical-align:top}th{font-weight:600}li{margin:8px 0;max-width:990px}.pending{color:#82674c}.notice{padding:16px 20px;border:1px solid #d4bfa1;border-radius:9px;background:#f3e8d5}code{font-size:12px;overflow-wrap:anywhere}.provenance{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr);gap:28px;align-items:center}.provenance img{width:100%;height:auto;max-height:280px;object-fit:contain;background:#f0e4d1;border-radius:10px;padding:12px}.fine{font-size:12px;color:#82705f}@media(max-width:720px){main{padding:25px 18px}.pair{grid-template-columns:1fr;gap:18px}.pair-mobile figure{max-width:390px;margin:auto}.table-scroll table{min-width:650px}.provenance{grid-template-columns:1fr}.provenance img{width:150px}h2{font-size:28px}}
</style></head><body><main>
<header><p class="eyebrow">Invitly · local production design review</p><h1>A little stationery.<br>A lot more character.</h1><p>The homepage now takes its visual direction from the supplied reference: warm paper, a burgundy invitation stack, original Indian botanical details, and a row of tall occasion cards. Existing login, FAQs, editor, dashboard, and guest invitation routes remain the next steps.</p><nav><a href="http://127.0.0.1:3001/">Open local homepage</a><a href="http://127.0.0.1:3001/#occasions">Explore the occasion row</a><a href="#performance">Measured performance</a></nav><p class="fine">Report generated ${escape(generatedAt)}. Before captures: ${escape(beforeCapture?.capturedAt || 'timestamp unavailable')}.</p></header>
${verification ? `<section><h2>Verified implementation</h2><p>${escape(verification.summary)}</p><p>${escape(verification.limits)}</p><p>${await fileLink('artifacts/stationery-verification.json', 'Exact verification record')} · ${await fileLink('artifacts/stationery-final-tests.log', 'Final artwork and responsive checks')} · ${await fileLink('artifacts/stationery-regression-tests.log', 'Homepage journey regressions')}</p></section>` : ''}
<section><h2>Desktop · before and after</h2><p>The earlier photographic hero is replaced by a composed stationery scene. Live SVG borders, peacocks, paisley, and botanical motifs give the cards detail while keeping the artwork independent of a large flattened screenshot. The heading and navigation remain live HTML.</p>${await comparison(widths[4])}</section>
<section><h2>360px · before and after</h2><p>The page rearranges into one column on phones, keeps Log in and the demo entry available, and presents the four occasion cards in a two-by-two grid. These paired captures show the actual first viewport at the same width.</p>${await comparison(widths[1], 'pair-mobile')}</section>
<section><h2>Four cards. Nine real occasion paths.</h2><p>Wedding, engagement, birthday, and baby shower cards open their actual occasion collections. Five additional links lead to housewarming, naming, anniversary, remembrance, and other gatherings. These are browsing links rather than inert illustrations; no future collection counts are advertised.</p><div class="pair">${await picture('artifacts/stationery-after/occasions-desktop.png', 'Occasion row · 1440px')}${await picture('artifacts/stationery-after/occasions-mobile-360.png', 'Occasion row · 360px')}</div><p>The main creation link opens the occasion collection; View the demo opens /demo. Collection cards preserve the occasion in /templates?occasion=[occasion]#collection.</p></section>
<section><h2>Exact screenshot pages and widths</h2><p>All homepage captures use route /. Available after captures: ${capturedWidths.length ? capturedWidths.join(', ') + 'px' : 'none yet'}. The hero and occasion row are captured separately so artwork, labels, and layout can be inspected without a full-page reduction.</p><div class="table-scroll"><table><thead><tr><th>Browser viewport</th><th>Before</th><th>After</th><th>Hero crop</th><th>Occasion crop</th></tr></thead><tbody>${captureRows.join('')}</tbody></table></div><p>${await fileLink('artifacts/stationery-before/capture.json', 'Before-capture metadata')} · ${await fileLink('tests/homepage-stationery.spec.ts', 'Capture and interaction test source')}</p><p>The test source checks image loading, SVG references, navigation links, the four gallery journeys, all nine occasion destinations, login entry, reduced motion, and horizontal overflow. Capture availability alone is not a claim that every test passed; retain the test run result alongside this report.</p></section>
<section><h2>Artwork, loading, and motion</h2><ul><li>Five reusable stationery variants are made with original SVG motifs and live HTML text. The hero displays three layered cards; the lower row displays four occasion cards. The stack is one clear link, with no carousel controls.</li><li>The decorative marigold branch is an original ${escape(provenance?.tool || 'built-in image generation')} asset, prepared as an optimized WebP. Next.js Image supplies responsive sizes and explicit dimensions. The shared card art requires no additional raster downloads or font families.</li><li>The hero uses a brief entrance animation and pointer hover transforms. Reduced-motion preferences remove those transitions; content remains visible. No audio or video autoplays.</li><li>Visible labels identify the destinations. Decorative SVGs and botanical imagery are hidden from assistive technology, and product links retain keyboard access.</li></ul><div class="provenance"><img src="../../public/images/marketing/marigold-branch.webp" alt="Original golden marigold branch with sage leaves" loading="lazy" width="600" height="900"><div><h3>Original marigold artwork</h3><p>${escape(provenance?.intent || 'Original transparent botanical illustration for the reference-inspired homepage.')}</p><p>${await fileLink(provenanceFile, 'Generation prompt and source provenance')} · ${await fileLink('public/images/marketing/marigold-branch.webp', 'Optimized website asset')}</p></div></div></section>
<section id="performance"><h2>Fresh measured homepage performance</h2>${performance}<p>${await fileLink(rawReportFile, 'Raw Lighthouse homepage report')} · ${await fileLink(summaryFile, 'Exact metric values, environment, and timestamp')}</p><p>These measurements are from a browser with mobile device, CPU, and network emulation against a local production build. They are not measurements from a physical phone, a live deployment, or WhatsApp’s in-app browser. No earlier milestone scores are substituted for this run.</p></section>
</main></body></html>`;

await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'index.html'), html);
console.log(`Wrote ${path.relative(root, output)}/index.html (${capturedWidths.length}/5 after screenshots; ${homepage ? 'fresh homepage measurement included' : 'Lighthouse pending'}).`);
