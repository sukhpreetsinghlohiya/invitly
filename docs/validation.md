# Production validation

Validation targets: mobile Lighthouse Performance ≥90, Accessibility ≥90, and no layout shifts caused by artwork or fonts. Run against the production server, since development mode includes compilation and debugging overhead.

```sh
npm run build
npm start -- --hostname 127.0.0.1
# In a second terminal:
npm run test:e2e
node scripts/measure-lighthouse.mjs
# Recheck selected routes after a targeted fix:
node scripts/measure-lighthouse.mjs kesar lotus sindoor templates
```

Both runners default to `http://127.0.0.1:3000`. Playwright uses installed Google Chrome and checks 360 × 800, 768 × 1024, and 1440 × 1000 viewports. Set `PLAYWRIGHT_BASE_URL` or `LIGHTHOUSE_BASE_URL` when testing another host. Lighthouse uses its standard simulated mobile network and CPU throttling. `CHROME_PATH` can point to a different Chrome installation.

Screenshots are written under `artifacts/screenshots/`. Lighthouse JSON and HTML reports are written under `artifacts/lighthouse/`, including a machine-readable `summary.json`. These generated artifacts should remain untracked. Lighthouse scores depend on machine load and are local lab measurements, not a substitute for real-device field data.

## Current milestone — 29 September 2026

The publishing, private guest-link, calendar, media, and live-announcement changes are being verified against an **isolated local Supabase instance** and the local production app. These results do not establish the state of the hosted Supabase project or a deployed production site.

| Check | Result |
| --- | --- |
| ESLint | Passed |
| Next.js production build | Passed |
| Unit tests | 17 passed |
| SQL row-level security checks | Passed against isolated local Supabase |
| Guest permission checks | Passed against isolated local Supabase |
| HTTP privacy checks | Passed against isolated local Supabase |
| Public browser checks | Full run: 71 of 72 passed; corrected test selector and targeted rerun: 1 of 1 passed |
| Authentication UI smoke check | 1 passed in 7.1 seconds |
| Remaining host/guest smoke checks | Pending final results: 6 cases running |
| Fresh mobile Lighthouse measurements | All 5 measured routes passed: Performance 98–99, Accessibility 100, CLS 0 |

All 72 public browser cases have now passed across the full run and targeted rerun; this is not a single clean 72-case run. The initial failure used an outdated selector for the mobile preview dialog. After correcting that test selector, its targeted rerun passed.

The authentication UI smoke check exercised signup, logout, anonymous dashboard protection, the recovery callback, password reset, rejection of the old password, and login with the new password. Testing found a callback origin mismatch between `localhost` and `127.0.0.1`; the callback now uses the configured `getSiteUrl`. Lint and the production build passed after that fix. These authentication results apply to the isolated local environment, including its local email capture, rather than production email delivery.

The September 27 browser and performance sections below are retained as a dated baseline. They must not be presented as measurements of this milestone. Remaining host/guest browser outcomes and limitations will be recorded after the running checks finish.

### Fresh mobile Lighthouse results

Measured on **29 September 2026, 06:42:41–06:43:18 UTC**, using Lighthouse 13.5.0 against the production app at `http://127.0.0.1:3001` with isolated local Supabase. The published fixture at `/i/invitly-local-preview` exercised the actual public RPC projection and loaded the realtime announcement client. This measures page performance and accessibility; it does not by itself establish realtime delivery correctness.

| Route | Mobile Performance | Accessibility | LCP | Total blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/i/invitly-local-preview` | 99 | 100 | 2,008 ms | 85 ms | 0 |
| `/` | 99 | 100 | 1,965 ms | 55 ms | 0 |
| `/demo?theme=royal` | 98 | 100 | 2,379 ms | 48 ms | 0 |
| `/demo?theme=modern` | 98 | 100 | 2,378 ms | 45 ms | 0 |
| `/demo?theme=floral` | 99 | 100 | 2,048 ms | 36 ms | 0 |

All five routes meet the stated mobile targets, with no failed weighted accessibility audits and no measured layout shifts. The exact results and timestamps are in the local [selected audit summary](../artifacts/lighthouse/summary-selected.json). The other theme, gallery, and editor scores below remain September 27 measurements.

Public browser checks refreshed mobile and desktop screenshots. Visual review of the refreshed [360 px homepage](../artifacts/screenshots/homepage-mobile-360.png) passed. Screenshot links in the historical table point to reusable artifact paths and may now show these refreshed captures; their presence alone does not imply a new manual review of every page.

## Historical Lighthouse results — 27 September 2026

Measured on 27 September 2026 with Lighthouse 13.5.0 against the local Next.js production build: the full thirteen-route audit ran at 10:41–10:42 UTC, followed by Kesar, Lotus, Sindoor, and gallery rechecks at 11:20 UTC after scoped contrast corrections. The table combines the latest report for each route. All thirteen routes meet the stated ≥90 targets, with Accessibility 100 throughout. No layout shift was measured, including while fonts and invitation artwork loaded.

| Route | Mobile Performance | Accessibility | LCP | Total blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 99 | 100 | 1,974 ms | 60 ms | 0 |
| `/demo?theme=royal` | 98 | 100 | 2,352 ms | 61 ms | 0 |
| `/demo?theme=modern` | 98 | 100 | 2,346 ms | 39 ms | 0 |
| `/demo?theme=floral` | 98 | 100 | 2,344 ms | 36 ms | 0 |
| `/demo?theme=mehfil` | 98 | 100 | 2,342 ms | 34 ms | 0 |
| `/demo?theme=kesar` | 94 | 100 | 2,627 ms | 76 ms | 0 |
| `/demo?theme=lotus` | 100 | 100 | 995 ms | 57 ms | 0 |
| `/demo?theme=pichwai` | 99 | 100 | 1,960 ms | 37 ms | 0 |
| `/demo?theme=ocean` | 98 | 100 | 2,349 ms | 38 ms | 0 |
| `/demo?theme=champagne` | 98 | 100 | 2,345 ms | 34 ms | 0 |
| `/demo?theme=sindoor` | 98 | 100 | 2,345 ms | 34 ms | 0 |
| `/templates` | 99 | 100 | 2,049 ms | 35 ms | 0 |
| `/customize` | 99 | 100 | 2,054 ms | 44 ms | 0 |

The initial audit identified small text contrast failures in Kesar, Lotus, Sindoor, and the gallery. Their CSS colors were corrected, the production build passed, and the four-route recheck returned Accessibility 100 with no failed weighted accessibility audits. Performance remained above target on all four routes; lab scores vary with machine load.

Local generated reports: [homepage](../artifacts/lighthouse/homepage.html), [gallery](../artifacts/lighthouse/templates.html), [editor](../artifacts/lighthouse/customize.html), and [JSON summary of all routes](../artifacts/lighthouse/summary.json). Theme reports use their theme ID, for example [Royal Indian](../artifacts/lighthouse/royal.html), [Midnight Mehfil](../artifacts/lighthouse/mehfil.html), and [Pichwai Garden](../artifacts/lighthouse/pichwai.html). Re-run the command above to generate them in a fresh checkout. Selected rechecks update their individual reports and merge the new measured results into `summary.json`.

## Historical browser checks and visual review — 27 September 2026

**Full run: 75 of 75 Playwright cases passed** in 54.8 seconds. After artwork and editor refinements, **30 of 30 targeted cases passed** in 31.0 seconds, including three new account-navigation draft-preservation cases. The suite now contains 78 cases; it has not been reported as a single 78-case run.

Coverage at 360 × 800, 768 × 1024, and 1440 × 1000 includes all ten themes, no horizontal overflow, four functions and map links, countdown, homepage navigation, gallery filtering, theme-to-editor navigation, live customization, invalid-name validation, local draft save/reload, theme persistence, function add/edit/remove, keyboard theme selection, phone preview overlay, and draft preservation before account navigation. Anonymous dashboard and event-editor access redirect to authentication/setup. Six direct validation cases cover malformed payloads, real calendar dates and offsets, theme/timezone restrictions, duplicate IDs, field limits, Unicode text, UTF-8 payload size, and allowed-field copying.

The demo RSVP save/reload/edit/decline, simulated updates/reset, and share-link clipboard/manual fallback also passed. Instrumented music tests verified no AudioContext exists before the guest taps Play. Public-page checks found no uncaught browser errors.

The complete schedule and directions also passed with JavaScript disabled at all three widths. An earlier global loading boundary that left no-JavaScript guests at a loading message was moved into the dashboard. Visual review corrected secondary-button contrast in Modern Minimal and Floral Celebration, plus decorative intersections with text in Kesar, Lotus, Ocean, and Sindoor. The four revised covers were recaptured and reviewed successfully before the thirteen-route audit.

Full-page and first-screen screenshots were reviewed at 360 px and desktop widths; tablet screenshots were also captured. Local previews:

| Page | Phone, first screen | Phone, full page | Desktop, full page |
| --- | --- | --- | --- |
| Homepage | [View](../artifacts/screenshots/homepage-mobile-360-viewport.png) | [View](../artifacts/screenshots/homepage-mobile-360.png) | [View](../artifacts/screenshots/homepage-desktop.png) |
| Royal Indian | [View](../artifacts/screenshots/royal-mobile-360-viewport.png) | [View](../artifacts/screenshots/royal-mobile-360.png) | [View](../artifacts/screenshots/royal-desktop.png) |
| Modern Minimal | [View](../artifacts/screenshots/modern-mobile-360-viewport.png) | [View](../artifacts/screenshots/modern-mobile-360.png) | [View](../artifacts/screenshots/modern-desktop.png) |
| Floral Celebration | [View](../artifacts/screenshots/floral-mobile-360-viewport.png) | [View](../artifacts/screenshots/floral-mobile-360.png) | [View](../artifacts/screenshots/floral-desktop.png) |
| Midnight Mehfil | [View](../artifacts/screenshots/mehfil-mobile-360-viewport.png) | [View](../artifacts/screenshots/mehfil-mobile-360.png) | [View](../artifacts/screenshots/mehfil-desktop.png) |
| Kesar & Sunshine | [View](../artifacts/screenshots/kesar-mobile-360-viewport.png) | [View](../artifacts/screenshots/kesar-mobile-360.png) | [View](../artifacts/screenshots/kesar-desktop.png) |
| The Lotus Letter | [View](../artifacts/screenshots/lotus-mobile-360-viewport.png) | [View](../artifacts/screenshots/lotus-mobile-360.png) | [View](../artifacts/screenshots/lotus-desktop.png) |
| Pichwai Garden | [View](../artifacts/screenshots/pichwai-mobile-360-viewport.png) | [View](../artifacts/screenshots/pichwai-mobile-360.png) | [View](../artifacts/screenshots/pichwai-desktop.png) |
| By the Blue | [View](../artifacts/screenshots/ocean-mobile-360-viewport.png) | [View](../artifacts/screenshots/ocean-mobile-360.png) | [View](../artifacts/screenshots/ocean-desktop.png) |
| Champagne Hour | [View](../artifacts/screenshots/champagne-mobile-360-viewport.png) | [View](../artifacts/screenshots/champagne-mobile-360.png) | [View](../artifacts/screenshots/champagne-desktop.png) |
| Sindoor Stories | [View](../artifacts/screenshots/sindoor-mobile-360-viewport.png) | [View](../artifacts/screenshots/sindoor-mobile-360.png) | [View](../artifacts/screenshots/sindoor-desktop.png) |
| Theme gallery | [View](../artifacts/screenshots/templates-mobile-360-viewport.png) | [View](../artifacts/screenshots/templates-mobile-360.png) | [View](../artifacts/screenshots/templates-desktop.png) |
| Editor: design | [View](../artifacts/screenshots/customize-design-mobile-360-viewport.png) | [View](../artifacts/screenshots/customize-design-mobile-360.png) | [View](../artifacts/screenshots/customize-design-desktop.png) |
| Editor: details | [View](../artifacts/screenshots/customize-details-mobile-360-viewport.png) | [View](../artifacts/screenshots/customize-details-mobile-360.png) | [View](../artifacts/screenshots/customize-details-desktop.png) |

The phone editor's [full-screen live preview](../artifacts/screenshots/customize-live-preview-mobile-360.png) was also exercised. Screenshots precede only the final small contrast-color adjustments described above.

Following the user's application of the three migrations on 27 September 2026, the Supabase configuration was rechecked without exposing keys or private records. Auth settings returned HTTP 200, with email signup enabled and confirmation required. At that time, anonymous REST reads for `events`, `themes`, `event_segments`, and `event_updates` returned HTTP 200; the event query recognized `theme_id`, `invitation_content`, and `music_enabled`, and the theme catalog returned all ten expected IDs. Anonymous reads of `profiles`, `media`, and `rsvps` returned HTTP 401 / PostgreSQL `42501`. These historical checks did not establish two-host row isolation. The September 29 implementation replaces raw anonymous invitation reads with filtered public/guest RPC projections; the earlier anonymous table-read results are not the expected security contract for the current implementation.

After the September 27 database setup, two targeted phone browser checks passed in 5.9 seconds: signed-out visitors to the dashboard and an owner-only invitation editor were redirected to login. The local signup page returned HTTP 200 and an absent public invitation returned HTTP 404. At that historical checkpoint, signup/confirmation/login/logout, password recovery, email delivery, authenticated invitation saving/publication, storage, realtime delivery, and two-user database isolation had not been verified end to end. No test users or remote records were created by those checks. That status is superseded by the September 29 validation section above, whose final browser checks are still pending. Local drafts, demo RSVP persistence, and simulated updates remain distinct from published guest links and live services.
