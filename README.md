# Invitly

A mobile-first Indian digital invitation platform for **invitly.co.in**. The current launch includes ten wedding designs and three engagement designs, a mobile editor, and Supabase-backed host workflows. Seven other occasion collections are marked **Coming soon**; their designs and existing saved invitations are retained for future polishing. Made by Sukhpreet.

## Run locally

Use Node.js 22 or newer (Node 24 LTS recommended). Copy the environment example only on first setup; keep your existing `.env.local` if it already contains your project settings.

```sh
npm install
cp -n .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Empty Supabase variables are supported: the homepage and all demo themes work, and account routes explain how to connect a project. Do not replace empty values with invented credentials.

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

`npm run start` serves the production build. Run browser/performance checks against that server, not the development server.

The scripts use Next.js's supported Webpack builder; Turbopack's CSS worker could not bind its internal port in this workspace. If another app already uses port 3000, run `npm run dev -- --port 3001`, then use that port in `NEXT_PUBLIC_SITE_URL` and the Supabase redirect settings below.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing homepage and interactive theme previews |
| `/demo` | Complete Royal Indian sample invitation |
| `/templates` | Wedding and engagement collections with searchable designs; seven future occasions marked Coming soon |
| `/demo?occasion=engagement&theme=lotus` | Engagement invitation preview |
| `/demo?occasion=birthday` (and other future occasions) | Coming soon page with links to available collections |
| `/demo?theme=royal` | Royal Indian theme |
| `/demo?theme=modern` | Modern Minimal theme |
| `/demo?theme=floral` | Floral Celebration theme |
| `/demo?theme=mehfil` (also `kesar`, `lotus`, `pichwai`, `ocean`, `champagne`, `sindoor`) | Additional theme demos |
| `/customize` | Customize a new invitation and preview it before saving |
| `/customize?event=EVENT_UUID` | Edit a saved invitation you own |
| `/i/[slug]` | Published invitation with functions, photos, directions, and announcements; private events return 404 |
| `/g/[token]` | Private guest response link; possession of this link authorizes the assigned guest response |
| `/dashboard/events/[eventId]/preview` | Full private invitation preview, restricted to its owner |
| `/dashboard/events/[eventId]/guests` | Host guest list and individual response links |
| `/dashboard/events/[eventId]/announcements` | Post, edit, pin, hide, and remove guest announcements |
| `/media/[mediaId]` | Image delivery that checks current publication status |
| `/signup` | Host registration with email and password |
| `/login` | Host sign-in |
| `/forgot-password` | Request a password reset email |
| `/auth/callback` | Verify an email link or exchange its PKCE code |
| `/reset-password` | Set a new password after verified authentication |
| `/dashboard` | Protected host celebration list with Draft, Published, and Unpublished states |
| `/account` | Protected account information and sign-out |
| `/setup` | Useful configuration instructions, without exposing key values |

Guests do not need an account to view public invitations. Host pages authenticate on the server using `getUser()` and never trust an unverified session object. The dashboard explicitly filters events by the authenticated owner; database row-level security also enforces ownership on writes.

## Host workflow

Choose a theme at `/templates`, then personalize it at `/customize`. The editor has six steps: Occasion, Details, Schedule, Photos, Design, and Share. Occasion-aware names, family messages, schedule, Google Maps links, dates, optional music, and theme choices use one validated invitation document. The gallery, editor preview and guest page share their actual cover renderer. Unsaved edits trigger a warning when leaving or reloading. Anonymous drafts can be saved on the current device; account saving and publication require Supabase and sign-in.

Choose the event's IANA time zone in Details. Date fields show local wall time in that zone; changing the zone preserves the entered wall time. The server stores explicit instants and the event zone. Invalid calendar dates and ambiguous or nonexistent daylight-saving times return errors instead of guessing. Public schedules display the event zone, regardless of the guest's device location.

Save an invitation before adding photos. Upload your own JPG, PNG, or WebP files up to 4 MB (4 MiB), with an accessible description. The app’s shared client/server limit leaves room for multipart fields below Vercel’s 4.5 MB function request limit; Next.js accepts a 4.25 MiB request envelope. The private Storage bucket retains its existing 5 MB ceiling. The server checks image content, rejects oversized pixel dimensions, removes metadata through re-encoding, and produces WebP images up to 1,600 pixels per side. Invitations support up to twelve photos. Owner previews fetch private images through an authenticated route; published image delivery checks visibility on every request. Unpublishing removes public access to the invitation and its photo endpoints.

Published guest photos additionally require the server-only `SUPABASE_SECRET_KEY`. Host uploads and owner previews use the host's own authenticated session. The guest photo proxy first checks publication through a restricted public RPC, then downloads the approved object server-side; it never returns a signed Storage URL. Without the secret key, account pages, editing, and public invitation text still work, but guest photo requests return 404.

The full preview opens the last saved invitation. Publish from Share to create `/i/[slug]`; later saves update that same page without redeploying. Changing the slug changes its address. The dashboard distinguishes never-published drafts from previously published invitations made private again.

Manage guest-facing messages under Announcements. Posts can be edited, pinned, hidden as private drafts, or removed. Private drafts are excluded from guest delivery. The demo's local RSVP and simulated updates remain clearly labelled previews; use a published invitation and its guest links to exercise connected workflows.

Under Guests, add guests individually or import a validated CSV, assign groups and party limits, and choose which functions each group can see. Newly generated `/g/[token]` links appear once for copying or download; only their hashes are retained in the database. Replacing a link revokes the old one. Guests can respond Attending, Maybe, or Declined without an account and update their response, subject to a short server-enforced update limit. The host list shows responses, party sizes, notes, and totals and supports CSV export. Treat each private link as a credential for that guest's response. Set **Functions on the public link** to selected functions or no schedule when functions must stay private to assigned groups; anything enabled on the public link is visible to anyone who has that link.

## Invitation audio

In **Design → A soundtrack for your story**, choose a wedding song, an original instrumental, a YouTube link, or **Upload your audio**. New wedding starters and demos feature the supplied “Dulhe Ki Behen Brigade” recording. Four Bollywood presets use official T-Series/Zee Music Company YouTube uploads; they remain in the visible YouTube player. Existing saved music choices are preserved.

Custom MP3 uploads require a signed-in host and a saved invitation. Files are limited to 10 MB and 15 minutes, uploaded directly to private storage with a signed upload token, then checked as actual MPEG Layer 3 audio. Save the invitation after uploading, replacing or removing a recording. Playback starts only after a guest presses Play, with pause/resume and volume controls. Removing a previously saved track detaches it; its private storage object is retained. Unused failed uploads are cleaned up.

Run `node scripts/setup-audio-storage.mjs --local` for the isolated local project or `node scripts/setup-audio-storage.mjs --hosted` for the project configured in `.env.local`. This idempotent Storage API setup creates a private `event-audio` bucket restricted to `audio/mpeg` and 10 MB. `SUPABASE_SECRET_KEY` is required server-side. No new SQL migration is required for audio. Upload actions check event ownership before issuing a token; direct authenticated bucket access is denied. The `/audio/[eventId]/[audioId]` proxy permits owner previews and otherwise serves only the currently selected track of a published, music-enabled invitation, with private/no-store byte-range responses.

Verify with `npm run test:e2e -- tests/music-venue.unit.spec.ts --project=data-validation`, and `INVITLY_LOCAL_PORT=3002 node scripts/local-integration.mjs audio` against a production preview on port 3002. The browser suite creates disposable local accounts and removes their files afterwards.

## Free invitation allowance

Each account can save its first **two invitations** free, using any template. A slot is consumed on the first successful account save, including private drafts. Editing, changing themes, publishing, and sharing existing invitations remain available. Deleting or unpublishing an invitation does not refund a slot. Anonymous previews and device-only drafts do not consume slots.

The dashboard shows usage; a third invitation opens `/dashboard/plan` with **Payments coming soon**. Checkout is disabled: no price, charge, paid entitlement, or payment-provider integration exists yet. A stale editor receives the same message on save and retains its device backup.

Apply `20260930171100_free_invitation_allowance.sql` after the previous migrations. It backfills existing saved invitations without deleting or restricting edits to them. Existing accounts above two cannot create more. A protected allowance table and an atomic database trigger enforce the limit, including direct API calls and concurrent requests. Missing allowance configuration blocks new account saves rather than granting unlimited usage.

Run `node scripts/local-integration.mjs allowance` for the SQL and real HTTP concurrency checks against disposable local Supabase. No hosted fixtures are created by these checks.

## Connect your Supabase project

1. Create a Supabase project you control.
2. In the project **Connect** panel or **Settings → API Keys**, copy the project URL and a **publishable** key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
   ```

   The application expects a modern key beginning `sb_publishable_`. Obtain it from your project; the strings above are explanatory placeholders. Public keys are intended for browser use and must be protected by RLS. Never add a Supabase secret key, `service_role` key, database password, or access token to Git or a `NEXT_PUBLIC_` variable.

   For guest photo delivery, create or select a secret key in **Settings → API Keys** and put its value in `SUPABASE_SECRET_KEY` in your ignored `.env.local`. Secret keys bypass RLS, so this value must remain server-only; leave the committed `.env.example` value blank. Do not paste secrets into chat. See [Supabase's API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).
3. Open **SQL Editor → New query**. Run the versioned migrations in order:

   - `supabase/migrations/202609270001_foundation.sql`
   - `supabase/migrations/202609270002_host_foundation.sql`
   - `supabase/migrations/202609270003_invitation_customization.sql`
   - `supabase/migrations/20260928184855_guest_management_and_publication.sql`

   - `supabase/migrations/20260930073714_occasion_aware_invitations.sql`
   - `supabase/migrations/20260930171100_free_invitation_allowance.sql`
   - `supabase/migrations/20261002171500_invitation_story_options.sql`

   Apply only migrations not already applied. These are one-time migrations; do not rerun successful files. The latest migration supports guest management, publication-aware delivery, event time zones, photo dimensions, and announcement visibility.
4. In **Authentication → Providers / Sign In**, enable Email and password sign-in. Keep email confirmation enabled. Configure custom SMTP for real deliveries; Supabase's default mail service has delivery restrictions and rate limits.
5. In **Authentication → URL Configuration**, set Site URL to `http://127.0.0.1:3000` for development. Add these exact redirect URLs:

   ```text
   http://127.0.0.1:3000/auth/callback
   http://127.0.0.1:3000/auth/callback?next=/reset-password
   https://invitly.co.in/auth/callback
   https://invitly.co.in/auth/callback?next=/reset-password
   ```

   On production, set both Supabase's Site URL and `NEXT_PUBLIC_SITE_URL` to `https://invitly.co.in`. Add any staging domains explicitly. Restart/rebuild after changing public environment variables.
6. Default confirmation/recovery emails using `{{ .ConfirmationURL }}` are supported through PKCE. Open these links in the same browser that initiated the request. For server-verifiable links that can open in another browser, optionally change **Authentication → Email Templates**:

   **Confirm signup** link:
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```

   **Reset password** link:
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
   ```

   `SiteURL` must point to the environment being tested. The callback only redirects to the fixed dashboard or reset-password route, never to arbitrary user-supplied destinations.
7. Restart `npm run dev`, visit `/signup`, confirm your email, and sign in.

Alternatively, if you already use the Supabase CLI, authenticate and link to your own project before applying migrations:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Use either the SQL editor or your normal migration workflow consistently; direct SQL editor execution does not populate the CLI's migration history. To regenerate TypeScript after changing the schema:

```sh
npx supabase gen types typescript --linked > src/types/database.ts
```

Local integration checks use a separate Supabase stack. They do not provision or migrate your hosted project. No credentials are included in the repository.

## Deploy on Vercel

Use the personal repository **https://github.com/sukhpreetsinghlohiya/invitly**, branch `main`. Git stores the complete app source, package lock, public assets and migrations. `.env.local`, secrets, `node_modules`, `.next`, `.vercel`, test reports and `artifacts` are ignored. Keep those ignored files out of GitHub.

1. In Vercel, choose **Add New → Project**, connect GitHub, and import `sukhpreetsinghlohiya/invitly`.
2. Select **Next.js**, root directory **./**, install command **npm ci**, and build command **npm run build**. Leave the framework's output setting at its default; this is a server-rendered app, not a static export. Use Node.js **22.x** (the package requires Node 22 or newer).
3. Add the following in **Project → Settings → Environment Variables** before deploying. Choose the correct scope (Production or Preview); use a separate staging Supabase project for previews.

| Variable | Value/source |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL, from its Connect/API settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The same project's `sb_publishable_...` key |
| `SUPABASE_SECRET_KEY` | The same project's server-only secret key; never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Full deployed HTTPS origin, such as `https://your-project.vercel.app`; use your verified custom domain when connected |
| `INVITLY_LEGAL_NAME` | Public operator/business name |
| `INVITLY_PRIVACY_EMAIL` | Public support/privacy email |
| `INVITLY_LEGAL_COUNTRY` | Operator's country |
| `INVITLY_LEGAL_REVIEWED` | Keep `false` until actual retention, infrastructure, providers and legal text are reviewed; `true` finalizes/indexes the notices |

The first four variables enable account, media and URL behavior. Legal variables finalize the policy pages; they do not themselves establish compliance. Values belong in Vercel settings, never in `.env.example` or GitHub. The checked-in `.env.example` only documents names.

4. Apply **all unapplied** `supabase/migrations/` files to the matching hosted project using the migration workflow above, including `20261002171500_invitation_story_options.sql`. Vercel builds do not run migrations. Verify hosted RLS and Storage configuration before real guests use it.
5. In Supabase **Authentication → URL Configuration**, set Site URL to the same HTTPS origin and allow the exact callbacks `https://YOUR-HOST/auth/callback` and `https://YOUR-HOST/auth/callback?next=/reset-password`. Keep email confirmation enabled and configure custom SMTP for real deliveries. Do not use localhost values for production.
6. Deploy, then verify signup/confirmation/reset, host saving, photo/music delivery, private guest links, RSVP visibility and announcements on the deployed URL. Add a custom domain only after these work and follow Vercel's displayed DNS records. Update both site URL settings when changing the primary domain.

Redeploy after changing variables: Next.js embeds `NEXT_PUBLIC_` values at build time. A normal Vercel Git deployment does not need GitHub Actions secrets. Do not configure local-only `INVITLY_BUILD_DIR`, `INVITLY_LOCAL_PORT` or integration-test credentials in Vercel.

Photo requests are capped at 4 MiB with a 4.25mb Server Action envelope to remain below Vercel's 4.5 MB request limit. Music upload goes directly to authenticated Supabase Storage; playback responses explicitly stream and retain publication checks and byte ranges. Production upload/playback still requires a hosted smoke check.

References: [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs), [environment variables](https://vercel.com/docs/environment-variables), [function payload limits](https://vercel.com/docs/functions/limitations), [streaming large responses](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Database and security

- `profiles`: one private profile per host, created by a narrowly scoped signup trigger.
- `events`: host-owned event drafts, unique slugs, theme selection, event time zone, publication status/history, optional music, and an atomic `invitation_content` JSON document. Guest delivery exposes only the fields needed by the invitation. A host cannot transfer ownership by updating a row. Changing a slug changes the share link; existing links are not redirected.
- `event_segments`: per-event functions with timings, venues, HTTPS map links, and ordering. Guest reads follow the parent event's visibility; writes require ownership.
- `themes`: ten seeded read-only theme definitions.
- `media`: event image metadata, dimensions, and accessible descriptions. Owner delivery and publication-aware guest delivery use separate endpoints.
- Guest management uses private individual response links. Never put guest tokens in analytics, logs, screenshots, or Git. The original `rsvps` table remains an authenticated RSVP foundation; the sample demo stores its labelled preview response only in the current browser.
- `event_updates`: host-owned announcements with published/private visibility, pinning, and edit timestamps. Public delivery excludes private drafts. Demo updates are sample data, separate from connected announcements.
- `event-media`: **private** Storage bucket with an unchanged 5 MB limit (the app accepts photos up to 4 MiB) and JPEG/PNG/WebP allowlist. Paths begin with an event UUID. Upload/removal actions independently verify ownership. Public image delivery checks event publication, downloads through a server-only secret client, and sends `private, no-store`; owner image delivery verifies the signed-in owner. Anonymous visitors cannot mint signed Storage URLs that would outlive unpublication.

The publishable key never bypasses RLS. Browser and authenticated server clients use typed `@supabase/ssr` clients. A separate server-only secret client is restricted in application code to the publication-checked photo proxy; it must not be used as a substitute for host ownership checks. Cookie refresh is confined to account/auth/dashboard/customization routes; public invite visitors do not pay for an authentication request. Protected responses use `private, no-store`.

The customization save action independently validates an allowlist of fields on the server, verifies the host with `getUser()`, and filters edits by owner ID. It never accepts a client-supplied owner or publication flag. New invitations start as drafts; edits preserve their existing publication status. `src/lib/invitation-draft.ts` provides matching shared validation, including strict calendar dates with timezone offsets, known themes, bounded content, unique function/update IDs, and Unicode text. Saving uses one atomic JSON document rather than partially saving each function. When custom content exists, the public renderer uses its functions; older events continue to use `event_segments` as a fallback. These two representations are not automatically synchronized.

Run database permission checks only against a disposable test project after applying its migrations. `supabase/tests/rls.sql` contains transactional policy checks; the local integration runner below also exercises host and guest permissions. A successful lint or build is not evidence that these database checks passed; consult the validation report for actual executions.

After connecting a real test project, verify:

1. Register host A, confirm email, log in, create a draft, and log out.
2. Open `/dashboard` in a private browser: it must redirect to `/login` when configured (or `/setup` when not configured).
3. Register host B; its dashboard must not show A's draft. Run the SQL policy check above.
4. Request/reset A's password, sign out, then verify only the new password works.
5. Open `/demo` without signing in; all invitation functions remain available.

## Content and structure

```text
src/app/                App Router pages, server actions, and auth callback
src/components/         Shared brand, interface, and invitation components
src/data/               Editable sample invitation and theme catalog
src/lib/supabase/       Typed browser/server clients, session refresh, data helpers
src/types/              Invitation data model and matching database types
supabase/migrations/    Versioned database, RLS, Storage, and Realtime setup
supabase/tests/         Transactional database policy integration checks
```

Edit `src/data/demo-invitation.ts` to change the couple, family names, dates, functions, venues, dress codes, and sample updates across all themes. `src/data/themes.ts` holds wedding themes and `src/data/occasion-themes.ts` defines the curated occasion collections. Theme layouts use shared typed data rather than duplicated customer pages. Dates include explicit offsets and render in the invitation's selected time zone; the fictional demo uses India Standard Time. Hindi, Marathi, Punjabi and Gujarati use self-hosted Noto Sans script subsets with swap font display and native fallbacks. Motifs include original SVG artwork and the supplied occasion illustrations; shared branding uses the supplied coral logo. Original instrumental moods and optional YouTube song embeds load only after a guest action. Fictional generated wedding photos are limited to demos/marketing. There is no autoplay audio. See [design tokens and asset licenses](docs/design-system.md).

## Current milestone and limits

The journal at `/blog` includes six topic collections and editable, file-based articles. Add posts from `content/blog/draft-example.json`, connect footer profiles in `src/data/site-socials.ts`, and choose invitation wording in **Details → Say it your way**. See [blog, social links and wording instructions](docs/blog-and-socials.md).

The demo supports function details, directions, countdown, optional user-initiated music, and RSVP preview. Host workflows include account authentication, saved invitation editing, time zones, original themes, photo uploads, private previews, publication controls, and announcement management. Public links use `/i/[slug]`; individual guest links use `/g/[token]`. Saving and publishing require a configured Supabase project and a signed-in host. Payments and customer-owned domains are outside this milestone.

The application supports both empty and configured local environments. Local lint, typechecking, production builds, and public UI checks do not establish that hosted migrations, SMTP delivery, or deployed Realtime work. The local integration stack uses disposable confirmed accounts, so it does not test real email delivery. See the validation report for exact tested operations and remaining deployment checks; credentials being present does not establish success.

Performance targets for the production public demo: Lighthouse mobile Performance ≥90, Accessibility ≥90, and no image/font layout shifts. Run Lighthouse against a production server and preserve reports with browser/viewport details; scores are measurements of that run, not guaranteed for every deployment. See generated verification artifacts and the implementation handoff for measured results.

See [production validation](docs/validation.md) for measured results and screenshots. To repeat the checks, leave the production server running and use a second terminal:

```sh
npm run test:e2e
node scripts/measure-lighthouse.mjs
```

The browser checks require Google Chrome installed on the machine. Reports and screenshots are local artifacts ignored by Git.

## Local host and guest integration checks

Install Docker and start its engine, then start the isolated stack configured in `supabase/config.toml`. The local project is `invitly-test`; these commands do not link to or migrate a hosted Supabase project. Use an available port 3001 for the test app.

```sh
npx --yes supabase start
npx --yes supabase migration up --local
mkdir -p artifacts
npx --yes supabase status -o json > artifacts/local-supabase.json
chmod 600 artifacts/local-supabase.json
node scripts/local-integration.mjs prepare
node scripts/local-integration.mjs build
node scripts/local-integration.mjs start
```

Leave that production server running. In a second terminal:

```sh
node scripts/local-integration.mjs test
node scripts/local-integration.mjs api
node scripts/local-integration.mjs unit
node scripts/local-integration.mjs public
# Optional fictional published preview and performance audit (Node 24):
node scripts/local-integration.mjs fixture
node scripts/local-integration.mjs lighthouse
```

`prepare` creates two confirmed disposable host accounts and stores their generated credentials in ignored `artifacts/integration/accounts.json`. The status JSON contains local admin credentials: do not print, share, or commit it. The runner refuses non-local Supabase URLs, supplies configuration only to child processes, and leaves your existing `.env.local` unchanged. It passes the local secret key to the server automatically for guest photo tests. Its `build` produces a build configured for the local stack; rebuild with deployment settings before deploying elsewhere. Resetting the local database invalidates test fixtures; prepare fresh accounts if you intentionally reset that disposable stack.

The auth smoke check additionally exercises local signup, logout, recovery callback, password replacement, and rejection of the old password. It uses a generated recovery token to test the callback independently of real email delivery.

The smoke suite is enabled only by `INVITLY_INTEGRATION=1` and runs on the `mobile-360` project. It checks saved edits and time zones, photos and owner preview, unsaved navigation, two-host isolation, public publication, private guest function selection, RSVP creation/updates, link rotation, live announcement changes, and unpublication. It disables authentication traces, videos, and screenshots. Announcement timing evidence is written to `artifacts/integration/announcement-latency.json`; check its `completed` flag and test output before treating the run as successful. The `api` mode runs focused permission checks separately. Commands documented here are reproducible instructions, not a claim that the latest run passed.

Auth implementation follows [Supabase's Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [password authentication guide](https://supabase.com/docs/guides/auth/passwords), and [email template documentation](https://supabase.com/docs/guides/auth/auth-email-templates).
