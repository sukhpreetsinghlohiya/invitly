# Invitly design foundation

The shared visual system lives in `src/app/globals.css`. The ten invitation styles are extended in `src/app/theme-collection.css`; the collection and editor have route-scoped styles in `src/app/templates/gallery.css` and `src/app/customize/editor.css`. Tailwind is available for layout utilities; reusable semantic classes keep marketing, invitations, and account forms consistent.

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

Spacing uses a mostly 4/8px rhythm with larger editorial section gaps. Mobile content gutters are 20px; desktop containers max out at 1200px. Form inputs are 16px to avoid phone zoom. Primary controls are at least 44px high. Illustration dimensions are reserved, with no remote bitmap dependencies.

## Ten invitation directions

Each theme has its own cover composition and carries its visual language into the guest page. Changing a theme changes more than its colours: alignment, framing, typography, function cards, and section shapes vary together. Body copy and controls retain the shared readable system.

| Theme / ID | Family / accent | Original cover composition | Guest-page direction |
| --- | --- | --- | --- |
| Royal Indian / `royal` | Indian · `#58252f` | Maroon arch, muted gold double border, and a restrained marigold garland | Classic serif headings and arched function cards |
| Modern Minimal / `modern` | Minimal · `#33473f` | Left-aligned contemporary typography, an open orbit, and oversized initials | Reversed desktop hero and a numbered vertical schedule with fine dividers |
| Floral Celebration / `floral` | Floral · `#3f624d` | Original flowering branches frame a soft ivory garden arch | Centred hero, soft function cards, and a curved RSVP section |
| Midnight Mehfil / `mehfil` | Indian · `#283650` | Deep indigo, a cusped jaali-inspired portal, gold diamonds, and a tiny star canopy | Arched cards, midnight icon medallions, and double-ruled RSVP borders |
| Kesar & Sunshine / `kesar` | Indian · `#995020` | Saffron folk sun above an asymmetric letter, with flowers below a cream wave | A gently angled cover, reversed desktop hero, warm alternating cards, and an asymmetric RSVP corner |
| The Lotus Letter / `lotus` | Floral · `#864954` | A blush oval, crescent, italic names, and an original layered lotus over water lines | A centred oval cover, soft petal colours, rounded ceremony cards, and a curved RSVP section |
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

`/customize` uses the same design tokens, form fields, and invitation artwork. The four steps are **Design**, **Details**, **Functions**, and **Share**.

- **Design:** select any of the ten themes with labelled buttons and `aria-pressed` states. Switching styles preserves the invitation content. A theme selected in the collection is carried through the URL.
- **Details:** edit both names, the opening line, message, families, wedding date/time, and city. An optional music setting offers the original melody; guests still have to press Play. Changes appear in the live cover and content preview.
- **Functions:** edit a function's name, date/time, venue, address, description, dress code, and motif. Add or remove functions within the editor's bounds. Times are explicitly labelled India Standard Time; guest directions use the entered address.
- **Share:** choose the invitation slug and publish. Authenticated hosts can save drafts to their account, publish or unpublish, copy the permanent link, open the guest page, or open WhatsApp with the invitation link prepared for sharing.
- Anonymous visitors can design and explicitly save a draft on their device. Publishing requires a configured Supabase installation and a signed-in host; the editor states the difference between a local draft and a permanent shared invitation. Successful local saves can be restored after reloading.
- A desktop preview sits alongside the controls. On narrow screens, **Preview invitation** opens the preview and **Back to editing** restores the controls. Pending saves, unsaved changes, validation failures, and successful saves have visible feedback.

## Guest interactions and states

The public guest page remains separate from the editor: guests receive the invitation view, not the host workspace. Theme navigation in the demo scrolls horizontally on phones instead of widening the page. Dates, function details, and directions remain useful before client-side interactions load.

The countdown renders stable initial placeholders, then updates on the client. Demo RSVP responses are clearly marked as local previews; demo host updates are explicitly simulated. Published records use the connected services. Optional music is loaded only after Play and has a Pause control. Sharing uses native Web Share where available, then clipboard or a selectable-link fallback. Form and interaction feedback use alert/status semantics instead of relying on colour alone.

## Assets and licensing

All flowers, botanical drawings, borders, compositions, favicon, and music sequence were created for Invitly in code. The seven extended covers add original SVG paths for a cusped portal, folk sun and flower stems, lotus petals, stylised peacocks, shell and waves, art-deco fans, and a rangoli medallion. Indian garden, jaali, and rangoli references inform the visual direction; the artwork is newly drawn rather than traced or taken from another invitation business. No Aamantran assets, layout, copy, or code are used.

The vectors reserve their layout space and scale to the cover dimensions without remote image requests. Decorative artwork is hidden from assistive technology when adjacent text already supplies the meaning. The music is an original eight-note ambient Web Audio composition, dynamically imported and initialized only by an explicit Play action; it uses no downloaded recording and never autoplays.

Lucide icons are supplied by `lucide-react` under the ISC license. Noto Sans Devanagari and Noto Sans Gurmukhi are supplied by Fontsource under the SIL Open Font License; copies are included in `public/licenses/`. Original code-drawn vectors need no image downloads; if photos are added later, use `next/image` with explicit dimensions and appropriately sized sources, and lazy-load below the first screen.
