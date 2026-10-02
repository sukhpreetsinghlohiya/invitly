# Production validation

## Invitation design and animated stories — 2 October 2026

Implemented and reviewed all 34 designs across nine occasions, including enhanced painted/engraved covers, independent ceremony-art motion, cover-first photo slideshows, a framed three-card album, individual couple/family profiles, optional film, independent countdown date, RSVP visibility and configurable envelope openings. Existing public/guest photo authorization and protected image delivery are preserved. Five specialist agents contributed across two waves; all project changes and review artifacts stayed inside the Invitly directory.

Final local verification against the production build at `127.0.0.1:3011`:

- Build (including TypeScript), full ESLint and `git diff --check`: pass.
- Data validation: 29 tests pass, including optional-field roundtrips, legacy drafts, bounded prefixes/portrait IDs and video-host validation.
- Public pages, editor, home/account entry and music regression: 28 pass; four database-dependent cases skipped because local Supabase is stopped.
- All 34 gallery/guest cover compositions, asset loading and readable actions at 390px and 768px: 18 pass; two editor cases intentionally excluded by project guard.
- New photo/ceremony interaction suite: 12 pass at 320px and 1440px. Covers chosen-photo order, autoplay visibility, pause, keyboard focus plus pointer exit, reduced/disabled motion, three-card album, lightbox navigation, independent dhol parts, quiet remembrance and artwork-off.
- Profile/options journeys: five pass across 360px, 320px and desktop, including save/reload, custom parents/grandparents prefixes, heading/portrait visibility, independent countdown date, RSVP off, envelope keyboard focus and click-to-load video. The all-ten-wedding long-name/sans-font regression also passes.
- Native-size visual review of all 34 covers, 14 ceremony scenes, portrait cards, original envelope, new album canopy and supplied hands SVG. Corrected a 7px Royal album overflow, a mobile hero-control overlap, thin SVG lines, and clipped moving-art seams. Final reviewed pages have zero horizontal overflow at 320px and 1440px.

Review artifacts are local/ignored: `artifacts/template-review/all-34-designs.png`, `artifacts/template-review/index.html`, `artifacts/experience-review/`, and browser logs under `artifacts/`.

**Database/deployment limit:** `supabase/migrations/20261002171500_invitation_story_options.sql` is required to include `personProfiles`, `profileSection`, `countdownAt` and `video` in published and personal guest projections. The new SQL regressions preserve legacy absence, public/private function filtering, guest-group behavior, private-key exclusion and media metadata filtering. SQL execution and actual authenticated upload/publish flows were not rerun: local Docker/Supabase is stopped. No hosted migration or deployment was applied. Editor/preview checks use authorized-route fixture photos; they are not evidence of a fresh storage upload test.


## Architecture review — 2 October 2026

Read-only review of the application boundaries, host actions, private media and public/guest projections found several remaining reliability and scaling items. These are separate from the template design work; this review is not a blanket production sign-off.

- Existing-event save failures write a device backup under an event-specific key in `src/components/editor/invitation-editor.tsx`, but editor initialization only restores the generic anonymous draft. A failed account save therefore needs an explicit recovery path before the “device backup” promise is reliable after reload.
- Photo uploads in `src/app/dashboard/media-actions.ts` permit 5 MiB through a Server Action. The configured 6 MB Next.js body limit does not remove Vercel Functions’ [4.5 MB request limit](https://vercel.com/docs/functions/limitations). Move the byte upload to signed storage, as audio already does, or lower the effective photo limit for that deployment.
- `src/app/audio/[eventId]/[audioId]/route.ts` downloads the full storage object before producing a range response. Repeated seek requests can repeatedly transfer and buffer the whole recording; saves also revalidate the selected recording. Streaming/range-aware storage retrieval and bounded revalidation would improve scale.
- Individual file limits do not form an account-level byte quota. Abandoned/replaced audio objects need cleanup and a bounded upload budget. Announcement fallback polling also repeatedly fetches the broader invitation projection; a narrow updates projection would reduce work.

The reviewed owner checks, server-only credentials, private-media cache protections, hashed guest tokens and SQL RSVP concurrency guards remain in place. A fresh local build, lint and 26 data tests passed during this review. Local Supabase was stopped, so live database authorization, hosted migration state, and production deployment were not reverified. The earlier isolated integration results below remain historical evidence, not new results from this pass.

## Local P0 verification — 1 October 2026

Verified the current app against isolated local Supabase and a production build on port 3010. This pass found and fixed a photo privacy issue: after an invitation was unpublished, its protected `/media/[id]` route returned 404, but a previously requested Next image-optimizer URL still returned cached bytes with a public four-hour cache lifetime. `images.localPatterns` now permits only public site artwork and bundled static images. Protected invitation media cannot enter the shared optimizer cache. A disposable fixture reproduced the issue before the fix and confirmed optimizer requests return 400 afterward, while the normal photo route changes from 200 to 404 on unpublish. [Before evidence](../artifacts/p0-image-cache-before.json), [after evidence](../artifacts/p0-image-cache-after.json).

- **Data and permissions:** All 26 data-validation tests passed, as did both SQL permission suites and real HTTP authorization checks. [Data log](../artifacts/p0-unit.log), [permission log](../artifacts/p0-permissions.log).
- **Host and guest journeys:** All six browser journeys passed: save/reload/private preview, account isolation, publication and saved edits, restricted guest RSVP and link rotation, announcements, and unpublication. Added checks cover calendar/update access after token rotation and unpublication, protected-photo optimizer rejection, and successful optimization of public site artwork. The suite now creates and cleans up fresh disposable accounts instead of consuming the same accounts' lifetime invitation allowance. [Journey log](../artifacts/p0-host.log).
- **Authentication:** Signup, logout, reset request, recovery callback, password change and subsequent login passed. An initial failure came from the test generating a recovery link solely to discover its cleanup user ID, which triggered the resend limit on the actual reset request. The test now reads its uniquely named fixture profile and verifies the fixture email before cleanup. No rate limit or app authentication behavior was changed. The callback check still uses an admin-generated recovery token; it does not prove delivery or clicking a real inbox message. [Authentication log](../artifacts/p0-auth.log).
- **Code checks:** The production build, including TypeScript, and full ESLint passed with the image-cache restriction. The final test-only refinements passed targeted ESLint and a final standalone TypeScript check. [Build log](../artifacts/p0-build.log), [lint log](../artifacts/p0-lint.log), [typecheck log](../artifacts/p0-typecheck.log).

No hosted migration, deployment or hosted invitation-content change was made in this pass. The hosted free-invitation allowance migration remains pending according to the last recorded hosted check; verify the hosted migration history, including guest/publication and occasion migrations, before release. Production environment and callback configuration, actual signup/reset email delivery, and physical iPhone/Android WhatsApp-browser journeys still need verification. The audio bucket is already documented as configured below. This pass did not rerun Lighthouse or the full audio-upload browser suite.

## Wedding songs and custom MP3 uploads — 1 October 2026

Added the supplied “Dulhe Ki Behen Brigade” MP3 as the featured track for new wedding starters and demos. The collection also offers London Thumakda, Nachde Ne Saare, Gallan Goodiyaan and Kala Chashma via official T-Series/Zee Music Company YouTube videos, verified through YouTube oEmbed metadata. Original moods and custom YouTube links remain available. Recorded audio is requested only after Play; pause/resume, volume, looping, error recovery and unmount cleanup are implemented.

Signed-in hosts can upload an MP3 to a saved invitation, preview it, replace/remove the selection, and save it for guests. Direct signed uploads avoid routing the file through a Next.js Server Action body. The private `event-audio` bucket caps files at 10 MB; server validation checks MPEG Layer 3 audio and a maximum duration of 15 minutes. Stored references contain canonical event/file UUIDs rather than arbitrary media URLs. Save actions verify ownership, event binding and file validity. The audio proxy checks owner access or the exact selected recording of a published, music-enabled invitation and serves non-cacheable byte ranges. Formerly saved but detached recordings remain private storage objects; they are no longer available through guest playback.

- Five music/venue unit checks passed, including recording round-trips, invalid identifiers and byte-range cases.
- Two final browser journeys passed at 360px: featured MP3 playback with no initial media request, Bollywood selection and draft reload; then real MP3 upload, rejection of a fake MP3, owner preview, account save/reload, publication, replacement and removal. Anonymous visitors and another signed-in host were denied draft audio. Even the owner could not bypass the proxy using direct authenticated Storage downloads. Published byte ranges matched the uploaded file; unpublishing and changing/removing the selected recording made former guest URLs return 404.
- The existing venue/instrumental/YouTube/nested-preview regression passed. The music collection had no horizontal overflow at 320, 360, 768 and 1440px. The custom-audio mobile capture was visually reviewed.
- Final full ESLint and the production build, including TypeScript, passed. Hosted and local private audio storage were configured through `scripts/setup-audio-storage.mjs`; audio requires no new SQL migration. End-to-end audio tests used disposable local accounts and cleaned up their storage objects. No hosted invitation content was changed by verification.

## Interactive celebration companion — 30 September 2026

The homepage’s “The invite is only the beginning” section now pairs clearer feature explanations with an interactive invitation sample. Four controls switch between host announcements, a schedule, an illustrative venue map and a sample RSVP. Contextual help explains guest visibility, directions, personal RSVP links and how announcements appear. Samples are explicitly labelled, and no responses or notifications are sent by this preview.

Chrome review covered desktop, 768, 360 and 320px layouts with no horizontal overflow. All four preview controls worked; keyboard focus and Escape dismissal worked for help, and a narrow-screen tooltip stacking issue was corrected and rechecked. “Explore event updates” reached `/demo#updates`. Full ESLint, standalone typechecking and the production build passed. These checks used the local app; no hosted data changed.

## Indian-language wording and the Invitly journal — 30 September 2026

Added explicit wording presets for English, Hinglish, Hindi, Punjabi, Marathi and Gujarati, with occasion-specific cover/opening text across all nine occasions and quiet remembrance copy. **Details → Say it your way** previews the four affected fields before **Use this wording** applies them. Six original file-based articles now serve `/blog`, six topic pages and individual article routes. An editable draft example stays outside public lists and routes. [Content and social-link management guide](blog-and-socials.md).

- **Journal and footer:** Nine browser checks passed at 320×740, 390×844 and 1440×1000. Topic-to-article navigation, full article content, metadata, occasion-appropriate design links, footer topic links and horizontal overflow checks passed. The five unconfigured social icons remain labelled and inactive rather than linking to invented profiles. Draft and unknown article URLs returned 404; draft title/body text did not leak into public HTML. [Final blog test log](../artifacts/blog-final-tests.log).
- **Wording journey:** Three checks passed at 360×800 on the final production build. Selecting a language alone preserves existing copy; explicit application changes only cover, opening, message and closing. Personal names, date and blessing remain intact. All six languages appeared in the actual guest preview, bundled Devanagari/Gurmukhi/Gujarati fonts were confirmed loaded, and the final applied wording survived device-local save/reload. Native-script cover text had normal spacing, style and case in both wedding and remembrance previews. All six remembrance variants stayed quiet without a wedding countdown. The data check covered all 54 complete presets and their field limits. [Final wording test log](../artifacts/wording-final-tests.log).
- **Cover regressions:** The earlier creative suite passed 11 cases across all five established widths. After long-copy and ornament refinements, two targeted long-copy/focus checks passed again. These targeted reruns overlap earlier coverage and are not additional unique cases. All ten covers were captured at 320px and 1440px with a 1,000-character blessing, 160-character cover text and 160-character location; no horizontal overflow occurred. Final visual review confirmed readable text surfaces and uninterrupted default Lotus artwork. Royal and Mehfil opening plaques remain within the first mobile viewport, and deliberately moving keyboard focus during opening is respected. Native-script prose uses natural spacing and 1.7 line-height; cover names use 1.4. [Targeted final log](../artifacts/creative-edge-polish-tests.log), [final capture measurements](../artifacts/long-copy-after/evidence.json).
- **Build status:** Full ESLint and the final Next.js production build, including TypeScript and native-script attributes in OccasionCover, passed. [Build log](../artifacts/indian-wording-blog-build.log), [lint log](../artifacts/indian-wording-blog-lint.log).

Screenshots: [journal at 320px](../artifacts/blog/journal-mobile-320.png), [desktop journal](../artifacts/blog/journal-desktop.png), [Ganesh Chaturthi article at 390px](../artifacts/blog/ganesh-chaturthi-mobile-390.png), [footer at 390px](../artifacts/blog/footer-mobile-390.png), and the [blog capture directory](../artifacts/blog/). Wording panel and guest previews for all six languages are in [invitation-wording captures](../artifacts/invitation-wording/), including [Hindi](../artifacts/invitation-wording/hindi-guest-360.png), [Punjabi](../artifacts/invitation-wording/punjabi-guest-360.png) and [Gujarati](../artifacts/invitation-wording/gujarati-guest-360.png).

Local production and browser emulation only; no deployment or hosted-content change. No Lighthouse rerun is claimed for this wording/blog follow-up, and previous milestone scores below are not new measurements of these additions. Physical-device and WhatsApp review remain pending.

## Free invitation allowance and homepage guidance — 30 September 2026

Each account gets two lifetime saved invitations, using any template. Signup copy, dashboard usage, a protected plan page, new-editor routing, both creation actions, stale-editor feedback and the database trigger enforce that flow. Existing invitations remain editable. The payment control is disabled and labelled “Payments coming soon”; no charge or paid entitlement is implemented.

Verified against isolated local Supabase and an isolated production build on port 3002:

- SQL checks passed for first/second saves, rejected third saves, edits and upserts at the limit, no refund on deletion, allowance write protection, account isolation, failed-save rollback and bulk-insert rollback.
- Eight simultaneous authenticated HTTP inserts accepted exactly two and rejected six. User-editable paid-plan metadata did not bypass the limit.
- The complete browser journey passed: usage 0 → 1 → 2, stale-tab save rejection with a retained device backup, disabled payment control, direct creation-route gating, and editing/reloading an existing invitation at the limit. The plan page fit 320, 360 and 1440px widths.
- Existing SQL and HTTP host/guest permission checks passed. Supabase security advisors returned no issues. ESLint, typechecking and the production build passed.
- A slow floral occasion marquee sits directly below the homepage hero. Its pause/resume control and lack of horizontal overflow were checked in Chrome at desktop and 360px widths. Duplicated visual content is hidden from assistive technology; reduced-motion CSS replaces scrolling with a static wrapped list.
- “How Invitly works” now has detailed creation, sharing and guest-response steps, three original HTML/CSS sample graphics, contextual help buttons and a free-plan explanation. Chrome checks covered desktop, 768, 360 and 320px widths, tooltip opening, Escape and outside-click dismissal, and no horizontal overflow. The final desktop graphics and headings align; narrow-phone tooltips fit the viewport. The final production build, full ESLint and standalone typecheck passed.

The hosted database still needs `20260930171100_free_invitation_allowance.sql`. Management CLI authentication was unavailable and the connected browser was signed out, so this session did not apply that hosted migration. The SQL is transactional and backfills existing invitation counts. No existing hosted invitations were changed or deleted.

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

Both runners default to `http://127.0.0.1:3000`. Playwright uses installed Google Chrome and checks 320 × 740, 360 × 800, 390 × 844, 768 × 1024, and 1440 × 1000 viewports. Set `PLAYWRIGHT_BASE_URL` or `LIGHTHOUSE_BASE_URL` when testing another host. The current Lighthouse runner uses applied DevTools mobile network and CPU throttling; historical results below used simulation. `CHROME_PATH` can point to a different Chrome installation.

Screenshots are written under `artifacts/screenshots/`. Lighthouse JSON and HTML reports are written under `artifacts/lighthouse/`, including a machine-readable `summary.json`. These generated artifacts should remain untracked. Lighthouse scores depend on machine load and are local lab measurements, not a substitute for real-device field data.

## Illustrated wedding covers and portrait gallery — 30 September 2026

[Before/after design and verification report](../artifacts/creative-audit/index.html). All ten existing wedding themes now have distinct illustrated covers shared by the gallery, editor preview and real guest page. Royal Indian and Midnight Mehfil have original palace and jaali door openings; the other eight begin directly with their illustrated invitation. The gallery presents four portrait cards per row on desktop, two from 380px through tablet widths, and one below 380px. Live preview and Use design remain connected to their actual demo and editor, with search, visual filters, optional tradition and all nine occasion collections preserved.

- **Lint and production build:** Full ESLint and the Next.js production build passed for the verified cover implementation. TypeScript passed in the production build.
- **Browser checks:** 22 cases passed across two completed runs: 11 focused creative-template checks and 11 existing guest-page, motion and occasion regressions. Eight intentional width-specific skips avoid repeating the complete multilingual editor and nine-occasion editor journeys outside their designated 360px project. These are two successful suites, not a claim of one combined test invocation.
- **Exact sizes and pages:** `/templates`, all ten `/demo?theme=[theme]` invitations and the real published invitation were checked at 320×740, 360×800, 390×844, 768×1024 and 1440×1000. All ten gallery drawings match their real guest artwork; all ten SVG compositions are distinct. Artwork loaded, quick schedule/directions and RSVP links resolved, and no horizontal page overflow was found. Wedding portrait stages and metadata align within each gallery row without cropping the covers.
- **Opening and motion:** Royal and Mehfil were exercised with normal and reduced motion at all five widths. Enter and Space open the invitation, opening states complete, and focus moves to the revealed invitation. Reduced motion leaves no running cover animation. Existing section-reveal regressions passed without layout shifts, and no music or video autoplays.
- **Editing and persistence:** At 360px, long English, Hindi and Punjabi names and a multilingual message survived all ten theme switches, decorative-artwork removal, device-local draft saving and reload. The actual phone and 1280px desktop preview flows passed, including closing the preview and returning focus to its trigger. Existing occasion-specific fields remained editable for all nine occasions.
- **Published invitation and visual review:** The real published fixture passed its opening, readable schedule, responsive photo and keyboard gallery checks at all five widths. Visual review corrected the Royal palace/footer overlap and separated ornament sizing from long-name cover growth. Royal, Kesar, Mehfil, Pichwai and multilingual previews were rechecked; final gallery captures were reviewed at 390px and 1440px with aligned preview pills and card copy.
- **Artwork provenance:** The detailed borders, botanical motifs, portraits and doors use original SVG/CSS with live editable HTML copy and existing local fonts. No competitor artwork, branding or code was copied. Optional decorative artwork can be removed; this work adds no autoplay media or motion library.

[Exact verification record](../artifacts/creative-verification.json), [focused final test log](../artifacts/creative-templates-final-tests.log), and [regression test log](../artifacts/creative-templates-regression-tests.log). The report links baseline and updated captures, all ten guest covers at five widths, and multilingual phone/desktop editor previews. These captures precede only the final color-only accessibility corrections to gallery captions and the Royal demo note; they document the final layout and artwork before those contrast changes.

Fresh measured performance, accessibility, LCP, CLS, page transfer and JavaScript transfer are recorded in the [creative-template Lighthouse summary](../artifacts/creative-templates-lighthouse/summary.json), with raw reports for the [gallery](../artifacts/creative-templates-lighthouse/templates.html), [Royal](../artifacts/creative-templates-lighthouse/royal.html), [Mehfil](../artifacts/creative-templates-lighthouse/mehfil.html) and [published invitation](../artifacts/creative-templates-lighthouse/published.html). The initial audit identified gallery-caption and Royal demo-note contrast failures. The corrected colors passed a fresh production build and remeasurement; all four routes now have Accessibility 100 with no failed weighted audits. Lighthouse measures the initial page, including the sealed entrance on Royal and Mehfil; screenshots also show their opened covers.

| Page | Performance | Accessibility | LCP | CLS | Transfer | JavaScript |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Published invitation | 99 | 100 | 1640 ms | 0.001 | 536.7 KiB | 223.8 KiB |
| Royal Indian | 97 | 100 | 2110 ms | 0.001 | 492.8 KiB | 158.5 KiB |
| Midnight Mehfil | 99 | 100 | 1716 ms | 0.001 | 441.6 KiB | 155.7 KiB |
| Template gallery | 92 | 100 | 2683 ms | 0.000 | 362.4 KiB | 151.3 KiB |

Measured 30 September 2026, 17:04–17:09 UTC, with Lighthouse 13.5.0, 412×823/DPR1.75 mobile emulation, applied DevTools 4× CPU slowdown, 562.5ms request latency and 1,474.56Kbps down / 675Kbps up. These are the latest per-route results. Royal returned Performance 81 / LCP 3690ms during the contrast recheck, then 97 / 2110ms on a diagnostic repeat with no application changes. That slower [raw result is retained](../artifacts/creative-templates-lighthouse/royal-contrast-recheck.json); performance is variable local lab evidence, not a guaranteed score. Mehfil was measured before the caption-only corrections, which do not affect its route.

This milestone uses the local production app and isolated test data only. It was not deployed, and hosted data or migrations were not changed. Browser mobile emulation is not a physical-phone or WhatsApp in-app browser measurement. The complete authentication/account-isolation suite was not rerun for this UI-only follow-up; its earlier verification remains recorded below.

Reproduce with `node scripts/local-integration.mjs creative`, `node scripts/local-integration.mjs creative-regression`, `node scripts/local-integration.mjs lighthouse-creative`, then `node scripts/write-creative-audit.mjs` while the isolated production app runs on port 3001. Use `node scripts/local-integration.mjs lighthouse-creative-fix` to remeasure the three routes affected by the final contrast corrections.

## Reference-inspired stationery homepage — 30 September 2026

[Before/after design and verification report](../artifacts/stationery-audit/index.html). The supplied reference informed a new warm-paper homepage with burgundy typography, a three-card invitation stack, original marigold borders, and four illustrated occasion cards. All nine occasion links lead to existing collections. Login, FAQs, footer, dashboard, editor and invitation journeys are preserved.

- **Lint and production build:** Full ESLint and Next.js production build passed after the final artwork refinement. Updated report scripts also passed targeted ESLint.
- **Browser checks:** 22 distinct cases passed: ten new stationery checks and twelve existing homepage/login/FAQ/footer regressions. Eight intentional skips cover width-specific regression cases. After separating card footer text from decoration and correcting responsive image sizes, all ten stationery checks passed again.
- **Exact sizes:** `/` checked at 320×740, 360×800, 390×844, 768×1024 and 1440×1000. No horizontal overflow. Visually reviewed mobile, tablet and desktop hero captures and the occasion row. All five stationery artwork variants render with clear footer copy.
- **Journeys:** Create opens the occasion collection, the demo opens the guest invitation, all nine occasion URLs respond, and the four featured cards open their correct filtered gallery with ten wedding or three other occasion designs. Login, account draft status, keyboard and no-JavaScript FAQs, and footer links passed existing regressions.
- **Media and motion:** Original server-rendered SVG card artwork uses live HTML typography and existing fonts. The transparent marigold WebP uses Next.js Image with explicit dimensions and responsive sizes; the second branch is lazy-loaded. Entrance and hover motion use CSS and respect reduced motion. No motion library, autoplay media, or new client component was added to this homepage composition.

| Page | Performance | Accessibility | LCP | CLS | Transfer | JavaScript |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage `/` | 99 | 100 | 1783 ms | 0.000 | 284.1 KiB | 143.9 KiB |
| Published invitation `/i/invitly-local-preview` | 99 | 100 | 1576 ms | 0.003 | 535.7 KiB | 226.9 KiB |

Measured 30 September 2026 at 16:41–16:42 UTC with Lighthouse 13.5.0 against the final local production build and isolated Supabase. Moto G Power (2022) browser emulation, 412×823/DPR1.75, applied DevTools 4× CPU slowdown, 562.5ms request latency, 1,474.56Kbps down / 675Kbps up. No failed weighted accessibility audits. The published invitation LCP measures its initial envelope. [Exact results, timestamps and environment](../artifacts/stationery-lighthouse/summary.json).

These are measured browser lab results, not physical-phone, WhatsApp or hosted-deployment measurements. This homepage follow-up did not change hosted data or rerun the complete editor/account-isolation suites; those results are recorded in the preceding milestone below. [Verification record](../artifacts/stationery-verification.json), [final artwork tests](../artifacts/stationery-final-tests.log), and [journey regressions](../artifacts/stationery-regression-tests.log).

The marigold illustration was generated with built-in `image_gen`: [saved WebP](../public/images/marketing/marigold-branch.webp), [exact prompt and provenance](../assets/source/homepage-marigold-prompt.json). The five card illustrations are original SVG/CSS rather than image-generated mockups.

Reproduce with `node scripts/local-integration.mjs stationery`, `node scripts/local-integration.mjs stationery-regression`, `node scripts/local-integration.mjs lighthouse-stationery`, then `node scripts/write-stationery-audit.mjs` while the isolated production app runs on port 3001.

## Homepage and editor follow-up — 30 September 2026

[Before/after screenshots and verification](../artifacts/home-editor-audit/index.html). Added always-visible homepage login, eight native FAQs, a useful shared footer and a guided editor with save location/status, step progress, Back/Continue and publishing readiness links.

- **Lint and build:** Full ESLint and Next.js production build passed. TypeScript passed in the build.
- **Homepage and guided editor:** 12/12 tests passed; eight intentional skips for width-specific login and no-JavaScript cases. Login visibility, 44px targets, keyboard/no-JS FAQs, footer routes, first-screen occasion choices, Back/Continue focus, device/account status, readiness links, draft save/reload, theme override status and actual preview passed.
- **Public pages:** 100/100 public-page checks passed across five widths before the final editor-only mobile spacing adjustment.
- **Editor regressions:** 30/30 passed on the final editor layout before the color-only accessibility fix. Five initial failures were obsolete text-only selectors that also matched new Continue captions; exact accessible button selectors fixed the tests. This is a successful targeted rerun, not a claim of a single clean initial 130-case run.
- **Occasion publishing journeys:** 2/2 passed: birthday creation, theme switching, real preview, save/reload, publication/dashboard and quiet remembrance wording.
- **Host and guest workflows:** 6/6 passed: photo uploads, save/reload, private preview, publication/editing, cross-account isolation, private media, personal RSVP, restricted schedules, token rotation, announcements and unpublish.
- **Responsive and visual review:** Checked 320, 360, 390, 768 and 1440px with no horizontal page overflow. First occasion choice fits completely without scrolling at all five widths. Reviewed mobile and desktop homepage/editor, mobile and desktop footer/FAQ, details and Share screenshots. Guest preview render widths remain 360px and 1280px.
- **Measured contrast corrections:** Darkened FAQ numbers, footer group labels and editor occasion numbers after the initial audit. Rebuilt and remeasured homepage, gallery and editor: all three returned Accessibility 100 with no failed weighted audits.

Checked 320×740, 360×800, 390×844, 768×1024 and 1440×1000; preview render widths 360px and 1280px. 150 distinct browser cases passed across the verification runs. Hosted data and migrations were not changed. Physical Android/iPhone and WhatsApp testing remain pending. Very tall mobile full-page screenshots can contain capture artifacts; the report uses dedicated first-viewport and section captures for the homepage. The focused editor images were captured from scroll position zero so sticky controls retain their normal placement. Responsive captures precede only the final small contrast-color changes to decorative numbers and footer group labels; those were rebuilt and re-audited with Lighthouse.

| Page | Performance | Accessibility | LCP | CLS | Transfer | JavaScript |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Published invitation | 99 | 100 | 1528 ms | 0.003 | 527.8 KiB | 226.9 KiB |
| Homepage | 99 | 100 | 1607 ms | 0.000 | 274.6 KiB | 143.8 KiB |
| Theme gallery | 99 | 100 | 1548 ms | 0.000 | 439.2 KiB | 150.3 KiB |
| Editor | 99 | 100 | 1536 ms | 0.000 | 401.0 KiB | 203.9 KiB |

Fresh measured local production results: Lighthouse 13.5.0, Moto G Power (2022) emulation at 412×823/DPR1.75, applied DevTools 4× CPU slowdown, 562.5ms latency, 1,474.56Kbps down / 675Kbps up. No physical phone or hosted production measurement. Royal LCP is the opening envelope; editor is the anonymous initial workspace. [Exact reports and timestamps](../artifacts/home-editor-lighthouse/summary.json). Prior milestone measurements below are retained separately.

## Current milestone — 30 September 2026

[Occasion design, before/after and verification report](../artifacts/experience-audit/index.html). Ten wedding designs and three curated designs for each of eight other occasions (34 occasion/design combinations) now use working gallery, editor and guest renderers. Supplied logo/favicon and transparent occasion graphics are integrated.

| Page | Performance | Accessibility | LCP | CLS | Transfer | JavaScript |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Personal guest / RSVP | 99 | 100 | 1545 ms | 0.003 | 523.5 KiB | 228.0 KiB |
| Published invitation | 92 | 100 | 2671 ms | 0.003 | 522.1 KiB | 226.9 KiB |
| Homepage | 99 | 100 | 1741 ms | 0.000 | 262.9 KiB | 143.8 KiB |
| Occasion gallery | 92 | 100 | 2684 ms | 0.000 | 432.5 KiB | 150.3 KiB |
| Birthday invitation | 98 | 100 | 1858 ms | 0.000 | 282.7 KiB | 158.9 KiB |
| Remembrance invitation | 98 | 100 | 1884 ms | 0.000 | 292.5 KiB | 158.9 KiB |

Lighthouse 13.5.0, applied DevTools throttling, Moto G Power (2022) emulation at 412×823/DPR1.75, 4× CPU slowdown, 562.5ms latency, 1,474.56Kbps down / 675Kbps up. Actual local production lab results, not physical-phone measurements. Royal invitation LCP measures the initial envelope screen. Exact timestamps and environment: [measurements JSON](../artifacts/lighthouse/summary-selected.json).

- **Lint and production build:** Passed on the final ceremony-art implementation; TypeScript checked by the production build.
- **Public and responsive UI:** 130/130 cases passed across all five viewports before the final ceremony-only addition; that addition received the focused 50-page check below.
- **Occasion, motion, maps and music:** 98 unique cases passed across the initial 97-pass run and the corrected 45/45 cover/motion recheck. Twelve intentional project skips. The initial tablet envelope scroll failure was fixed and all five motion cases passed.
- **Authenticated occasion journeys:** 2/2 passed: birthday creation, three curated theme switches, actual preview, save/reload, publish/dashboard and remembrance wording.
- **Host and guest workflows:** 6/6 passed: uploads, owner-only preview/media, two-account isolation, publication/live editing, private RSVP, restricted schedules, token rotation, announcements and unpublish.
- **Validation and security:** 24/24 validation tests passed; both SQL permission suites and real HTTP privacy boundaries passed against isolated local Supabase.
- **Ceremony artwork on final build:** 6/6 tests passed, 4 intentional project skips: 10 wedding themes × 5 widths × 4 demo ceremonies = 200 image checks, plus all 7 artwork subjects in the actual editable preview. Hindi/Punjabi matching, reception priority, neutral fallback, reload and decoration removal passed.
- **Logo, favicon and supplied illustrations:** All 9 illustrations loaded with zero horizontal overflow at five widths; hover movement and reduced-motion override verified. Favicon ICO, PNG icon and Apple icon all served HTTP 200.

Checked at 320×740, 360×800, 390×844, 768×1024 and 1440×1000 across homepage, gallery, editor, 24 curated non-wedding choices, all ten wedding themes, published invitation and personal guest RSVP. Authenticated dashboard inspected at the same widths with a 900px height. All 90 legacy links were checked at 360px. Actual iframe preview widths were 360px and 1280px. The report links screenshots and lists exact routes.

Local lab and isolated test data only. New cover screenshots were inspected at phone and desktop sizes; ceremony schedule screenshots were reviewed at 320px and desktop. Longer custom content may expand the cover vertically; default curated demos keep Directions fully in the first viewport. Hosted production was not modified. The earlier initial UI audit remains historical; this report records the later occasion/artwork follow-up.

Pending: hosted migration/deployment, real WhatsApp/physical-device review, ten dedicated designs per tradition, and a licensed commercial-song catalog. Existing original synthesized moods and optional YouTube embeds require an explicit guest action. No hosted production state was changed.

## Historical milestone — 29 September 2026

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
