# Invitly design foundation

**Current launch scope:** wedding and engagement. The remaining seven occasion collections show Coming soon in discovery and the editor; new creation and demo routes are gated by `src/data/occasion-availability.ts`. Existing saved invitations remain editable and renderable. The future design specifications below are retained for later polishing.

The shared visual system lives in `src/app/globals.css` and `src/app/design-system.css`. The latter exposes Tailwind v4 semantic tokens for surfaces, primary/hover colors, borders, radii, panel shadows and page spacing. The customized shadcn/ui button pattern is in `src/components/ui/button.tsx` and is used for dashboard publication controls. The ten invitation styles are extended in `src/app/theme-collection.css`; the collection and editor have route-scoped styles in `src/app/templates/gallery.css` and `src/app/customize/editor.css`. Tailwind is available for layout utilities; reusable semantic classes keep marketing, invitations, and account forms consistent.

## Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--ivory` | `#f9f6ef` | Warm page background |
| `--paper` | `#fffdf8` | Card/form surfaces |
| `--ink` | `#302921` | Main text |
| `--muted` | `#6e655a` | Supporting readable text |
| `--maroon` | `#58252f` | Primary actions and Royal Indian |
| `--gold` | `#b88d4c` | Decorative borders/motifs, not small body text |
| `--sage` | `#506756` | Fresh accent and botanical details |

English headings use the device's book serif (Iowan/Palatino/Georgia). Paragraphs and controls use system sans. Hindi and Punjabi use self-hosted, script-subset Noto Sans at one regular weight, with native script fallbacks and `font-display: optional` to avoid late font swaps. Text uses semantic `lang` attributes. Do not put long copy in decorative typography.

Buttons use `.button`, `.button-secondary`, `.button-light`, and `.button-small`. Forms use `.form-field`, `.form-error`, `.form-success`, `.form-feedback`; errors and async updates have alert/status semantics. Navigation and form controls have visible keyboard focus. Shared loading and error boundaries give recoverable states. Reduced-motion disables transitions and smooth scrolling.

Spacing uses a mostly 4/8px rhythm with larger editorial section gaps. Mobile content gutters are 20px; desktop containers max out at 1200px. Form inputs are 16px to avoid phone zoom. Primary controls are at least 44px high. Illustration dimensions are reserved, with no remote bitmap dependencies. The Royal guest view uses local, original generated photography; host photos use responsive, publication-checked image endpoints.

## Ten wedding invitation directions

Each theme has its own cover composition and carries its visual language into the guest page. Changing a theme changes more than its colours: alignment, framing, typography, function cards, and section shapes vary together. Body copy and controls retain the shared readable system.

| Theme / ID | Family / accent | Original cover composition | Guest-page direction |
| --- | --- | --- | --- |
| Royal Indian / `royal` | Indian · `#58252f` | Maroon arch, muted gold double border, and a restrained marigold garland | Rose paper envelope, photographic hero, local Cormorant/Great Vibes fonts, alternating desktop timeline and compact mobile timeline |
| Modern Minimal / `modern` | Minimal · `#33473f` | Left-aligned contemporary typography, an open orbit, and oversized initials | Reversed desktop hero and a numbered vertical schedule with fine dividers |
| Floral Celebration / `floral` | Floral · `#3f624d` | Original flowering branches frame a soft ivory garden arch | Centred hero, soft function cards, and a curved RSVP section |
| Midnight Mehfil / `mehfil` | Indian · `#283650` | Deep indigo, a cusped jaali-inspired portal, gold diamonds, and a tiny star canopy | Arched cards, midnight icon medallions, and double-ruled RSVP borders |
| Kesar & Sunshine / `kesar` | Indian · `#995020` | Saffron folk sun above an asymmetric letter, with flowers below a cream wave | A gently angled cover, reversed desktop hero, warm alternating cards, and an asymmetric RSVP corner |
| The Lotus Letter / `lotus` | Floral · `#864954` | A blush oval, floral rosette, italic names, and an original layered lotus over water lines | A centred oval cover, soft petal colours, rounded ceremony cards, and a curved RSVP section |
| Pichwai Garden / `pichwai` | Indian · `#435947` | Sage botanical court with a lotus crown, flowering side borders, and two original facing peacocks | Offset cover frame, double-bordered cards, botanical greens, and fine garden borders |
| By the Blue / `ocean` | Contemporary · `#225972` | An open coastal letter with a line-drawn shell and three sweeping layers of water | Reversed desktop hero, modern typography, open schedule cards, and an asymmetric blue RSVP section |
| Champagne Hour / `champagne` | Minimal · `#75603e` | Angular art-deco geometry, restrained capitals, and warm metallic linework | Uppercase serif headings, diamond icon frames, and square double-bordered cards |
| Sindoor Stories / `sindoor` | Indian · `#a43828` | Vermillion court, cream inner panel, original rangoli medallion, and diamond borders | Festive red accents, alternating asymmetric cards, and a bold RSVP border |

`src/data/themes.ts` supplies the ID, display name, editorial category, description, family, sequence number, and accent for every theme. `ThemeId` is shared by the catalog, editor, and public invitation. `src/components/invitation-art.tsx` renders every original cover from the same invitation data; compact variants suit the collection cards, while the normal cover suits the editor and guest pages.

`src/data/demo-invitation.ts` supplies the fictional sample wedding. All names, dates, functions, venues, messages, and updates come from a typed invitation model. `/invite/[slug]` renders published Supabase records through one public route. No customer-specific page copies are needed.

## Collection interactions

`/templates` presents a boutique collection, with the host journey stated as **Choose a feeling → Make it yours → Publish & share**.

- The five filter buttons are **All**, **Indian**, **Minimal**, **Floral**, and **Contemporary**. They update the visible cards immediately, expose the active choice with `aria-pressed`, and announce the new result count through a status region. The initial counts are 10, 5, 2, 2, and 1 respectively.
- Each card has a theme-specific Preview link to `/demo?theme=ID` and a Customize link to `/customize?theme=ID`. The cover itself also opens the demo. Link names include the theme so keyboard and screen-reader users can distinguish repeated actions.
- The server renders the cover artwork and passes it to the small client filter component as React slots. The gallery does not need the vector drawing code in its client bundle. Card links disable speculative prefetching of all ten demos/editors.
- Three desktop columns become two on intermediate screens and one on narrow phones. Card artwork keeps explicit dimensions; optional hover movement is removed for reduced-motion preferences.

## Editor interactions

`/customize` uses the same design tokens, form fields, and invitation artwork. The six steps are **Occasion**, **Details**, **Schedule**, **Photos**, **Design**, and **Share**.

- **Occasion:** choose one of nine occasions and an optional tradition. The selected occasion controls field labels, starting copy and curated designs.
- **Design:** choose among ten wedding themes or three curated designs for the selected non-wedding occasion. Labelled buttons expose `aria-pressed`; switching preserves content. Occasion, tradition and theme remain in the URL for anonymous editing.
- **Details:** edit occasion-appropriate names, cover text, message, family details, main date/time and city. Birthdays and remembrance do not require two names. Changes appear in the actual guest preview.
- **Photos:** upload a cover and gallery with validation, progress and clear errors.
- **Music:** choose an original instrumental mood or an official YouTube video; guests explicitly open/play audio.
- **Schedule:** edit any function’s title, date/time, venue, address, Google Maps link, description, dress code and visibility. The invitation timezone is explicit; guest directions use the saved pin or address.
- **Share:** choose the invitation slug and publish. Authenticated hosts can save drafts to their account, publish or unpublish, copy the permanent link, open the guest page, or open WhatsApp with the invitation link prepared for sharing.
- Anonymous visitors can design and explicitly save a draft on their device. Publishing requires a configured Supabase installation and a signed-in host; the editor states the difference between a local draft and a permanent shared invitation. Successful local saves can be restored after reloading.
- A desktop preview sits alongside the controls. On narrow screens, **Preview invitation** opens the preview and **Back to editing** restores the controls. Pending saves, unsaved changes, validation failures, and successful saves have visible feedback.

## Guest interactions and states

The public guest page remains separate from the editor: guests receive the invitation view, not the host workspace. Theme navigation in the demo scrolls horizontally on phones instead of widening the page. Dates, function details, and directions remain useful before client-side interactions load.

The countdown renders stable initial placeholders, then updates on the client. Demo RSVP responses are clearly marked as local previews; demo host updates are explicitly simulated. Published records use the connected services. Optional music is loaded only after Play and has a Pause control. Sharing uses native Web Share where available, then clipboard or a selectable-link fallback. Form and interaction feedback use alert/status semantics instead of relying on colour alone.

## Assets and licensing

The original flowers, botanical drawings, borders, compositions and music sequences were created for Invitly in code. The current user-supplied logo and raster occasion illustrations are documented below. The seven extended covers add original SVG paths for a cusped portal, folk sun and flower stems, lotus petals, stylised peacocks, shell and waves, art-deco fans, and a rangoli medallion. Indian garden, jaali, and rangoli references inform the visual direction; the artwork is newly drawn rather than traced or taken from another invitation business. No Aamantran assets, layout, copy, or code are used.

The vectors reserve their layout space and scale to the cover dimensions without remote image requests. Decorative artwork is hidden from assistive technology when adjacent text already supplies the meaning. The music is three original Web Audio compositions, dynamically imported and initialized only by an explicit Play action; it uses no downloaded recording and never autoplays.

Lucide icons are supplied by `lucide-react` under the ISC license. Noto Sans Devanagari and Noto Sans Gurmukhi are supplied by Fontsource under the SIL Open Font License; copies are included in `public/licenses/`. Original code-drawn vectors need no image downloads; photos use `next/image` with responsive sizes and reserved dimensions. Host uploads are limited to 5 MB and still JPEG/PNG/WebP, decoded and re-encoded by Sharp with metadata stripped. Authenticated and public image endpoints offer 320/640/960/1600px WebP variants without bypassing access revocation. Only the cover is preloaded; gallery images are lazy. Cormorant Garamond (regular and italic) and Great Vibes (one weight) are local SIL OFL fonts; licenses are in `public/licenses/`.


## Occasion-aware editor and guest preview — September 30

The six stages are Occasion, Details, Schedule, Photos, Design and Share. Incomplete drafts may omit names and dates; publication validates required names/date and schedule details. The database migration makes `events.starts_at` nullable for drafts and preserves the publication date constraint. Mutations authenticate the host and use explicit owner predicates plus existing RLS.

`src/data/occasions.ts` supplies editable starting copy for nine occasions. Tradition is an explicit, optional preference with a neutral default, never inferred from a name. No sacred symbols are injected. Dedicated collections with ten designs for every tradition are future curation, not advertised as implemented. The ten wedding compositions remain available. Eight other occasions each have three curated designs using occasion-specific covers and guest sections. Remembrance disables countdowns and animation and uses restrained wording.

The editor supports approved palettes and font treatments, decorative artwork removal, section ordering, chosen cover photo and optional music. `src/app/preview` uses the same guest renderer in a same-origin iframe at real 360px/1280px widths. Messages validate source/origin/data; the preview is private, noindex and never published. Saved private preview and public guest pages are server-rendered. Editor code does not enter public guest routes.

Mobile editor steps wrap into two rows. Save and Preview live in the sticky header rather than overlaying form fields. Guest opening screens expose date, schedule/directions and RSVP anchors. Private guest links submit real RSVPs; public links explain how to obtain the personal RSVP link. Music code loads only after Play. Native dialogs handle photo viewing; there is no motion library.

## Original photographic assets

Created with the built-in image-generation tool, using fictional adult subjects. Art direction: an Indian couple in a warm sandstone palace courtyard; bride in a dusty-rose lehenga, groom in an ivory sherwani; natural romantic editorial photography, no logos, no copied template imagery. The second image keeps the same fictional couple beneath a palace arch. Generation was followed by Sharp WebP compression at quality 78, not compositing or retouching.

- `public/images/wedding/courtyard.webp`: 1536 × 1024, homepage and Royal demo cover.
- `public/images/wedding/palace-walk.webp`: 1024 × 1536, Royal demo story/gallery.
- Original PNG outputs are retained locally in ignored `artifacts/generated-originals/`; no Aamantran media, copy, branding, schema or template was imported.

The host's real invitation uses only their uploaded photographs. Fictional generated photos appear in the wedding demo and marketing, not as default personal photos in birthdays or memorials.

## Indian artwork, occasions, motion and music — 30 September follow-up

Nine occasion-specific starting designs now have original removable SVG illustrations: a palace pavilion (wedding), rings (engagement), birthday cake and balloons, cloud and moon (baby shower), a marigold doorway (housewarming), cradle (naming), floral rings (anniversary), a quiet wreath and candle (remembrance), and a floral gathering motif. Dhol, peacock and marigold toran illustrations extend the wedding experience. These are decorative cultural/nature motifs; no deity, scripture or sacred emblem is inserted from a name or tradition preference.

The current catalog contains ten wedding designs and three curated designs for each of eight other occasions (34 selectable occasion/design combinations). These use shared layout components with occasion-specific art direction, rather than claiming 34 unrelated rendering systems. Older occasion/theme URLs continue to render, but are not advertised as additional curated designs. Hosts retain editable wording, colours, typography, section order, photos, venue/map link, and music when switching. Non-wedding examples no longer inherit the wedding's Haldi description or dress code. Remembrance omits the countdown and festive toran.

The supplied clipart sources were inspected. One downloaded public-domain asset is included: [Paisley Simple by jaschon](https://publicdomainvectors.org/en/free-clipart/Paisley-Simple-Vector-Pattern/1684.html), sourced from Open Clip Art Library via Public Domain Vectors. Its page explicitly allows commercial copying, modification and distribution. The SVG was restricted to drawing elements, stripped of editor metadata, and recoloured; license/source details live in `public/licenses/paisley-public-domain.txt`. Getty/Magnific/PNGTree assets were not imported without their asset-specific commercial rights. The original SVGs in `src/components/indian-art.tsx` are locally authored, not traced from those libraries.

Motion uses shared 140/220/380ms tokens, transform/opacity-only section reveals through one IntersectionObserver, and a 560ms envelope opening followed by a 360ms (gentle) or 460ms (expressive) expansion of the real guest cover. Gentle, expressive and still settings are host-selectable. Existing content is visible without JavaScript, and reduced-motion preference overrides decoration. There is no new animation package, scroll event loop, particle field or autoplay media.

Venues now expose a clear Google Maps search/share flow, exact saved-pin link, address card, directions and accessible copy fallback. [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) open Maps across devices without an API key. No location is guessed from a shortened share URL; no Google SDK or map iframe loads on page entry.

Music has three original synthesized compositions inspired by Indian textures: Courtyard strings, Evening breeze, and Mehfil rhythm. They are not licensed commercial recordings, sampled instruments, or claims of authentic instrument performances. The engine loads only after Play, with volume, pause, fade, and cleanup when changing tracks. A host may instead paste an official YouTube video URL. A visible privacy-enhanced YouTube iframe loads only after tapping Our song; playback requires the player's Play control. It is removed on close. No audio extraction or hidden player is used. Refer to [YouTube embedding guidance](https://support.google.com/youtube/answer/171780) and [player requirements](https://developers.google.com/youtube/player_parameters). A first-party catalog of popular Bollywood/Punjabi recordings and song-file uploads remain a separate licensing/storage feature; [IPRS licensing](https://iprs.org/get-your-license/) is a starting point for rights review, not a blanket clearance of master recordings.

Motion and music configuration are validated within the existing versioned `invitation_content.design` JSON and server-authorized save flow; no additional database schema migration is needed for this follow-up.

## User-provided logo and illustrated occasion collection

The coral invitation mark supplied on 30 September is the product logo. Its pixels, proportions, colour and transparency are retained; only transparent outer padding and web dimensions are normalized. The shared `BrandMark` appears in marketing, account/dashboard/editor headers and guest branding. `public/images/brand/invitly-mark.png` is the optimized mark; Next.js file metadata supplies `src/app/favicon.ico` (16/32/48/64px), `src/app/icon.png` (192px) and `src/app/apple-icon.png` (180px). `assets/source/invitly-logo.png` retains the supplied original. Decorative flower motifs remain artwork, not the logo.

The supplied nine-occasion sheet was prepared with the **built-in imagegen tool** (background extraction), preserving the nine subjects and their order. The selected transparent result is `assets/source/occasion-sheet.png`. The browser assets are `public/images/occasions/{wedding,engagement,birthday,baby-shower,housewarming,naming,anniversary,remembrance,other}.webp`, each 480×360 with alpha. `scripts/prepare-brand-art.mjs` reproducibly slices complete sprite regions, retains antialiased edges, and encodes WebP, avoiding clipped foliage from equal-cell crops. Cards use Next.js responsive sizes, reserved dimensions and lazy loading. The sprite master is never downloaded by the browser. These are user-provided/generated assets, not stock downloads from Getty, Magnific or PNGTree.

Selected image edit prompt:

> Use case: background-extraction. Edit target: attached Indian occasion illustration sprite sheet. Remove ONLY the blurred green/brown/gold background and glow, replacing it with genuine alpha transparency. Preserve the exact nine illustrations, their colors, hand-painted detailed style, flowers, gold and terracotta details. Keep the original 3-column by 3-row ordering: pavilion, engagement rings, birthday cake; moon and cloud, welcoming doorway, cradle; anniversary rings, remembrance candle, marigold flower. Keep each entire illustration isolated and centered within its own equal rectangular cell, with clear transparent gutters, no overlap or cropping. Output one landscape 3:2 transparent sprite sheet suitable for splitting into nine website assets. No labels, no new objects, no shadows or background rectangles. Do not redesign the artwork.

The occasion cards use 220ms lift/press feedback and a 380ms artwork transition on pointer hover, with visible keyboard focus. Reduced motion disables the transforms. The nine categories remain real navigational links. Mobile cards pair artwork and readable content; tablet uses two columns, desktop three.


## Curated occasion compositions and guest journeys

`src/data/occasion-themes.ts` is the typed collection registry. The non-wedding renderer in `src/components/occasions/occasion-cover.tsx` shares actual cover markup across gallery cards, editor previews and guest pages. Its three composition families are signature, editorial and keepsake. Each occasion has a named selection with an accurate preview and description. `occasion-cover.module.css` supplies paper shapes, typography, palette controls, responsive artwork placement and opt-in entrance transitions. Hosts can remove illustrations; no religion is inferred or symbol inserted.

| Occasion | Signature design | Alternatives | Guest treatment |
| --- | --- | --- | --- |
| Engagement | The Promise Letter | The Engagement Edit; Pressed Promises | Personal note and clear celebration schedule |
| Birthday | The Birthday Ticket | Birthday, In Print; Birthday Postcard | Large celebrant name, party details and ticket-style schedule |
| Baby shower | Little Cloud Letter | The Arrival Journal; Tiny Beginnings | Soft cloud stationery and family wishes |
| Housewarming | The Open Door | New Address Journal; A Note From Home | Doorway artwork, prominent venue/address and directions |
| Naming | A Name in Bloom | The Little Name Edit; First Little Keepsake | Name announcement and family stationery |
| Anniversary | Then & Always | The Anniversary Edition; An Evening, Remembered | Album-like story and shared memories |
| Remembrance | A Life, Remembered | The Memory Journal; A Cherished Keepsake | Restrained tribute, no countdown or decorative motion, quiet RSVP wording |
| Other gathering | The Supper Poster | The Gathering Gazette; Just Come Over | Warm host poster and straightforward gathering details |

`occasion-experience.tsx` supplies the non-wedding guest journey. It preserves real RSVP forms, calendar downloads, announcements, ordered sections, uploaded photos, map links and private-guest visibility. Optional music is in a listening strip below the cover so it cannot overlap the mobile RSVP action. Main date, schedule, directions and RSVP are reachable from the cover. Anonymous RSVP storage is scoped to the demo invitation. Preview links to valid external HTTPS maps or songs may open a safe new tab; editing stays in place. Nested music and preview dialogs close one layer at a time and return focus.

## Ceremony illustrations — Haldi, Sangeet, Wedding, Reception and more

Five original transparent illustrations were generated with the built-in `image_gen` tool for Haldi, Sangeet, Mehndi, Reception and Baraat. The existing supplied wedding pavilion and engagement rings complete a seven-subject ceremony registry. Visual direction: detailed botanical gouache/watercolour, engraved antique brass, ivory jasmine, natural foliage and marigolds, with distinct ceremony objects and no automatically inserted sacred symbols. The full exact prompt set is preserved in `assets/source/ceremony-prompts.json`; original generated PNGs are retained locally in ignored `artifacts/generated-originals/ceremonies/`.

Final project assets are `public/images/ceremonies/{haldi,sangeet,mehndi,reception,baraat}.webp`, each 600×450 with verified alpha transparency. They are 65–142KiB at source; The current layered animation renderer shares these small local textures between the still image and SVG parts, avoiding a duplicate optimized copy. `scripts/prepare-ceremony-art.mjs` reproduces resizing/compression from the local originals while preserving transparency. No stock art was downloaded for this set.

`src/data/ceremony-art.ts` matches explicitly named functions in English, Hindi and Punjabi. Specific ceremonies take precedence over the generic word wedding: “Wedding reception” uses reception artwork. An explicitly supplied occasion provides its own artwork for otherwise unknown titles; without an occasion, unknown titles retain the host’s neutral sun/music/heart/sparkle motif. This does not identify anyone’s religion or change their schedule. All ten wedding renderers use `CeremonyArt`; it reserves a 4:3 area, loads lazily, and is hidden when Decorative artwork is disabled. Mobile artwork is 128px; desktop is 220px. The editor explains how function titles select the illustration. Shared section transitions provide motion without an extra animation package.

## Engraved stationery across all 34 templates — 2 October 2026

The nine-occasion catalogue retains its ten wedding and twenty-four non-wedding IDs. Every non-wedding cover now uses a portrait paper canvas sized with container units, shared by gallery, editor and guest pages. Signature compositions use occasion-specific borders and illustrated focal points; editorial editions use a masthead and illustrated date column; keepsakes use portrait mounts, engraved corners and date seals. Birthday includes vintage ticket and airmail treatments; housewarming centres the welcoming doorway; remembrance keeps restrained ivory paper and quiet typography. Custom long copy grows the paper rather than being clipped. Blank wording remains blank. Personal cover photos remain visible when decorative artwork is disabled.

All ten wedding covers retain their individual palace, garden, paisley, lotus, peacock, coastal or geometric compositions, with refined engraving, ink colours, typography and date ornaments. Modern uses an entwined-ring seal. Existing long-copy frame slices and user-selected palettes remain supported. The guest schedule, note and RSVP sections continue the stationery typography and ink palette; mobile galleries show a full-width design at a time and catalogue descriptions align by row.

New archival assets are local SVG geometry, with external references and editor metadata removed. `ArchiveOrnament` renders them as decorative CSS masks so palette changes recolour the artwork. The botanical branch is from ClipSafari; the floral divider and vintage balloon are from Openclipart. Exact asset pages, creators, CC0/public-domain provenance and modifications are recorded in [archival-ornaments.txt](../public/licenses/archival-ornaments.txt). These engravings complement the previously documented original wedding drawings and supplied occasion illustrations. No new image-generation asset was used for this pass.

The cover’s state flag is `data-artwork="on|off"`; `data-decoration` marks only actual decorative descendants. This distinction prevents the global artwork-off rule from hiding the entire non-wedding invitation. Names, date, venue, actions and personal photography remain present. Indic font fallbacks, reduced motion, keyboard focus and editable section order are preserved.


## Portraits, photo stories and motion — 2 October 2026

The 34 covers now share the full invitation experience. Royal, Floral, Mehfil, Kesar, Champagne and Sindoor stationery use detailed painted ceremony scenes; Modern retains restrained botanical engraving, while Lotus, Pichwai and Ocean use detailed lotus, peacock and shell linework. Additional Openclipart/ClipSafari provenance is in `public/licenses/wedding-archive-art.txt`. No new generated raster was added in this pass.

Uploaded photos appear in a cover-first crossfade with a restrained camera move. `HeroPhotoSlideshow` and the three-card `PhotoGallery` use one playback hook: autoplay pauses offscreen, in hidden tabs, on hover/focus, for explicit pause, and for reduced motion or the host’s motion-off setting. Manual controls still work. Albums support touch swipes, arrow keys and the existing accessible full-size dialog. Photos resolve only from the authorized `EventPhoto[]`; private images continue through `InvitationImage` and the protected image routes. The first selected cover loads first, with only neighbouring photographs prepared. Fictional demo photos are limited to demo mode.

The original `PhotoAlbumFrame` combines a scalloped floral canopy, engraved hanging buds and botanical corners; modern/coastal/art-deco designs use the quieter mount. It is code-native SVG, not a copy of the reference frame. The user-supplied hands SVG is separately recorded in `public/licenses/save-date-hands.txt`, rendered as a theme-coloured mask with a small matching stroke for mobile legibility. It is not represented as CC0 artwork.

`CoupleProfiles` introduces separate portraits for wedding, engagement and anniversary invitations. Names and parents reuse existing invitation fields. Optional `personProfiles` adds photo IDs, grandparents and customizable prefixes; `profileSection` controls its heading and portrait visibility. Legacy drafts need no migration of their JSON. Missing photographs use a typographic monogram rather than guessing which uploaded photograph belongs to whom. The editor links to the existing secure photo uploader.

`InvitationMotion` shares observers for section entrances, independent ceremony parts and cover details. Venue text enters in a short stagger. Dhol beaters, skin and tassels move separately; leaves, petals, garlands, balloons and candle details receive appropriate motion. The complete base painting stays still. Offscreen scenes and hidden tabs pause. Remembrance remains quiet. Content remains visible without JavaScript.

Details now includes an independent countdown date and an optional YouTube/Vimeo film. Design includes RSVP visibility and three opening choices: theme original, straight to invitation, or an original paper envelope with ring, flower or monogram seal. Films load only on the guest’s click and never autoplay. Envelope keyboard focus moves to the invitation after opening; skip and reduced-motion paths are immediate. Existing background-music library, original instrumentals, YouTube soundtrack and private MP3 upload remain available.

New optional public fields require `supabase/migrations/20261002171500_invitation_story_options.sql`. It extends the explicit public/guest projection without changing publication, hidden-function or guest-group filtering. The save action verifies every selected cover/portrait ID belongs to the current owner-checked event. SQL regressions cover new-field roundtrips and existing privacy boundaries; execution requires a running local Supabase database.


## October 2026 wedding, engagement and product polish

Wedding and engagement are the launch collections; all other occasions remain marked coming soon. The ten wedding covers and three engagement covers reserve separate areas for copy and artwork, grow for long multilingual names, and share their real renderers across the gallery, homepage, dashboard and editor. Three public-domain botanical SVGs from Openclipart/ClipSafari are recorded in `public/licenses/stationery-botanicals.txt`.

Shared feedback provides accessible toasts, native confirmation dialogs with safe initial focus and Escape cancellation, loading states and duplicate-request guards. The editor supports Cmd/Ctrl+S. Marketing navigation collapses into a keyboard-accessible mobile menu. Galleries and guest lists debounce local search by 180ms. Phone formatting only recognizes complete explicit +91/+1 numbers; other international inputs are preserved. Invitation images use a neutral blur placeholder while preserving revocable-media loaders.

Per-function calendar options support Google and Outlook, plus Apple/.ics through the existing authorized download routes. Function selection happens after guest/public visibility filtering. End times are clearly labelled two-hour estimates. Guests see a local-time supplement when their browser timezone differs. Google Maps embeds load only after a guest chooses them; saved exact pins remain the directions destination, while Waze uses coordinates only when explicitly available and otherwise labels the address search.

Public marketing and published blog pages have canonical/social metadata, robots and a sitemap. Guest links, invitation pages, host pages and uploaded media have no-index protections. These indexing directives supplement authorization; they do not secure a resource themselves. No analytics or advertising tracker is installed, so no optional cookie consent banner is shown. Existing authentication cookies and local draft storage are described in the policy draft.

Privacy/Terms remain pre-launch drafts until operator contact information and deployment details are reviewed. `INVITLY_LEGAL_NAME`, `INVITLY_PRIVACY_EMAIL`, `INVITLY_LEGAL_COUNTRY` and an explicit `INVITLY_LEGAL_REVIEWED=true` control final status. Confirm actual retention, processing locations and provider arrangements before setting that flag. Supabase Auth enforces server rate limits; the UI countdown is supplementary, and hosted rate/SMTP settings still need deployment verification. The outstanding invitation-story SQL migration must be applied separately before relying on new saved story fields in hosted guest projections.
