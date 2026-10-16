import { themes, type InvitationTheme } from "@/data/themes";
import type { OccasionId, ThemeId } from "@/types/invitation";

export type OccasionLayout = "signature" | "editorial" | "keepsake";
export type OccasionTheme = InvitationTheme & { layout: OccasionLayout };

type CollectionEntry = [id: ThemeId, name: string, category: string, description: string, keywords?: readonly string[]];
const collections: Record<Exclude<OccasionId, "wedding">, CollectionEntry[]> = {
  festival: [
    ["royal", "The Festival Letter", "A WARM INVITATION", "An ivory letter with fine terracotta borders and artwork chosen for your celebration.", ["festival", "diwali", "eid", "christmas", "cream", "classic"]],
    ["kesar", "Colour & Company", "LET THE CELEBRATION BEGIN", "A saffron editorial invitation with generous festival lettering and a bold date column.", ["festival", "holi", "navratri", "yellow", "colourful"]],
    ["mehfil", "Evening Lanterns", "GOOD COMPANY, WARM WISHES", "Midnight teal, brass details and a keepsake illustration for a festive gathering.", ["festival", "gurpurab", "ganesh chaturthi", "lantern", "evening"]],
    ["sindoor", "The Festive Darbar", "A GATHERING OF COLOUR", "Vermillion borders, folk floral motifs, and a bold invitation that carries the warmth of celebration.", ["festival", "navratri", "diwali", "red", "colourful", "folk"]],
    ["pichwai", "Garden Gathering", "NATURE IN CELEBRATION", "A sage-green invitation with peacock motifs, delicate floral borders, and a quiet festive joy.", ["festival", "holi", "ganesh chaturthi", "green", "garden", "nature"]],
    ["ocean", "Coastal Celebration", "WHERE WAVES MEET WISHES", "Sea-blue paper, a fine date column, and a joyful invitation that feels like a fresh breath of air.", ["festival", "eid", "christmas", "blue", "coastal", "modern"]],
  ],
  engagement: [
    ["lotus", "The Promise Letter", "A PROMISE IN BLOOM", "A garden of antique roses, intertwined rings, and graceful names within a fine double arch on blush paper.", ["pink", "flowers", "gold", "romantic"]],
    ["royal", "The Engagement Edit", "A NEW CHAPTER", "An ivory announcement with generous serif names, a rose-filled illustration, and a burgundy date ribbon.", ["red", "cream", "flowers", "rings", "editorial"]],
    ["floral", "Pressed Promises", "A LITTLE FOREVER", "Watercolor roses and golden rings in a sage portrait mount, with a dated seal and delicate engraved details.", ["green", "cream", "flowers", "botanical"]],
    ["mehfil", "The Midnight Proposal", "PROMISED UNDER THE STARS", "Deep emerald, a golden ring illustration, and an announcement written for the evening sky.", ["dark", "green", "gold", "stars", "romantic", "evening"]],
    ["modern", "A Fresh Beginning", "OUR SIMPLE PROMISE", "Clean sage-green lines, a watercolour ring painting, and a promise written with quiet intention.", ["green", "simple", "minimal", "modern", "clean"]],
    ["sindoor", "The Vermillion Promise", "A PROMISE FULL OF WARMTH", "Rich red borders, a folk ring illustration, and an engagement announcement alive with colour.", ["red", "warm", "traditional", "flowers", "vibrant"]],
  ],
  birthday: [
    ["kesar", "The Birthday Ticket", "ONE VERY HAPPY DAY", "A sunshine-yellow party ticket with a perforated detail line, birthday cake, and big joyful type.", ["yellow", "warm", "fun", "cake"]],
    ["modern", "Birthday, In Print", "YOUR DAY. YOUR EDITION.", "A teal birthday edition with oversized type and a floral watercolor cake, ready for your own photo.", ["green", "editorial", "modern", "clean"]],
    ["ocean", "Birthday Postcard", "SENT WITH A LITTLE MAGIC", "An airmail-striped border, a floral birthday cake, and a small circular date seal.", ["blue", "airmail", "postal", "fun"]],
    ["royal", "The Birthday Darbar", "ONE GRAND BIRTHDAY", "A maroon and ivory letter with fine gold details and an invitation fit for a proper celebration.", ["red", "gold", "traditional", "grand", "classic"]],
    ["lotus", "A Birthday in Bloom", "SWEET AND CELEBRATED", "Blush paper, a floral birthday cake illustration, and a joyful invitation in soft warm colours.", ["pink", "flowers", "romantic", "soft", "warm"]],
    ["mehfil", "Birthday After Dark", "AN EVENING TO CELEBRATE", "Midnight teal, a golden cake illustration, and a night-time birthday gathering with real elegance.", ["dark", "evening", "gold", "dinner", "sophisticated"]],
  ],
  "baby-shower": [
    ["floral", "Little Cloud Letter", "A LITTLE LOVE ON THE WAY", "A soft sage letter with a botanical cradle illustration, arched paper, and a gentle welcome for family.", ["green", "botanical", "gentle", "nature"]],
    ["lotus", "The Arrival Journal", "A NEW LITTLE CHAPTER", "Apricot paper, flowing serif names, and a floral cradle painting for a new little adventure.", ["pink", "flowers", "romantic", "soft", "tender"]],
    ["modern", "Tiny Beginnings", "SMALL MOMENTS. SO MUCH LOVE.", "A cream keepsake with a watercolor cradle illustration, engraved floral corners, and a date seal.", ["cream", "minimal", "clean", "keepsake"]],
    ["pichwai", "The Garden Welcome", "A LITTLE ONE IN BLOOM", "Sage-green garden paper, a peacock-framed cradle, and a gentle celebration of every new beginning.", ["green", "garden", "peacock", "nature", "earthy"]],
    ["kesar", "Sunshine & Sweetness", "A WARM WELCOME", "Saffron paper, folk flower art, and a warm invitation for a gathering of love and good wishes.", ["yellow", "warm", "folk", "flowers", "festive"]],
    ["royal", "The Classic Cradle", "A TREASURED BEGINNING", "Ivory and burgundy stationery, a delicate floral cradle, and an announcement full of quiet ceremony.", ["cream", "traditional", "classic", "elegant", "ceremony"]],
  ],
  housewarming: [
    ["pichwai", "The Open Door", "MAKE YOURSELF AT HOME", "An arched doorway, marigold garlands, and an address card ready to welcome your guests.", ["green", "garden", "arched", "doorway"]],
    ["kesar", "New Address Journal", "A PLACE FOR NEW MEMORIES", "A warm terracotta house journal with a bold welcome and the location at centre stage.", ["yellow", "terracotta", "editorial", "bold"]],
    ["modern", "A Note From Home", "OUR DOOR IS OPEN", "An olive and cream keepsake with an arched doorway illustration and finely drawn botanical corners.", ["green", "cream", "minimal", "botanical"]],
    ["floral", "A Bloom of Home", "GROWING WHERE YOU ARE PLANTED", "Watercolour botanical borders, a garden-gate doorway, and a welcome full of natural warmth.", ["flowers", "botanical", "garden", "green", "warm"]],
    ["mehfil", "The Evening Welcome", "GOOD COMPANY, WARM HOME", "Midnight teal, a lantern-lit doorway, and an invitation for a warm and memorable evening.", ["dark", "evening", "lantern", "dinner", "sophisticated"]],
    ["champagne", "The New Home Edition", "A PLACE TO CALL YOUR OWN", "Dark paper with a bold address column, fine gold details, and a geometric door illustration.", ["dark", "gold", "geometric", "modern", "editorial"]],
  ],
  naming: [
    ["lotus", "A Name in Bloom", "A NAME FULL OF LOVE", "A tender cradle announcement with a generous name, soft rose paper, and room for family wishes.", ["pink", "flowers", "gentle", "tender"]],
    ["floral", "The Little Name Edit", "THE BEGINNING OF A STORY", "An elegant editorial announcement with oversized name typography and a beautifully illustrated cradle.", ["green", "botanical", "editorial", "elegant"]],
    ["modern", "First Little Keepsake", "A MOMENT TO TREASURE", "Soft blue-grey stationery with a cradle illustration, fine floral engraving, and a dated seal.", ["green", "minimal", "clean", "keepsake"]],
    ["kesar", "The Sunshine Name", "A BRIGHT LITTLE BEGINNING", "Saffron folk borders, a gentle cradle illustration, and a name that deserves a golden welcome.", ["yellow", "warm", "folk", "sunshine", "festive"]],
    ["pichwai", "Garden of Names", "A NAME THAT BLOOMS", "Peacock-green paper, a floral cradle, and an announcement from a family full of love and nature.", ["green", "peacock", "garden", "nature", "earthy"]],
    ["royal", "The Name Darbar", "ANNOUNCED WITH JOY AND CEREMONY", "Ivory and burgundy stationery, fine floral borders, and a name presented with tradition and warmth.", ["cream", "traditional", "classic", "ceremony", "elegant"]],
  ],
  anniversary: [
    ["champagne", "Then & Always", "STILL CHOOSING YOU", "Dark green paper, a floral infinity ribbon, and a fine double frame around your two names.", ["dark", "gold", "infinity", "elegant"]],
    ["floral", "The Anniversary Edition", "ANOTHER BEAUTIFUL CHAPTER", "A graceful magazine-style celebration of your shared years, with space for a favourite portrait.", ["green", "botanical", "editorial", "elegant"]],
    ["mehfil", "An Evening, Remembered", "WITH LOVE, THEN AND NOW", "A midnight-blue keepsake with brass botanical engraving, a floral infinity ribbon, and a date seal.", ["dark", "midnight", "gold", "keepsake"]],
    ["royal", "The Anniversary Letter", "YEARS WORTH CELEBRATING", "An ivory letter with fine borders, a floral ribbon, and names that have stood the test of time.", ["cream", "traditional", "classic", "elegant", "ceremony"]],
    ["lotus", "Soft Years", "A DECADE OF LOVE", "Blush paper, an infinity rose illustration, and an anniversary invitation full of gentle enduring warmth.", ["pink", "flowers", "romantic", "soft", "tender"]],
    ["sindoor", "A Vermillion Celebration", "STILL FULL OF COLOUR", "Rich red paper, bold floral motifs, and an anniversary that celebrates every chapter yet to come.", ["red", "warm", "traditional", "vibrant", "festive"]],
  ],
  remembrance: [
    ["modern", "A Life, Remembered", "IN LOVING MEMORY", "A candle and greenery on warm ivory paper, with an understated border and clear gathering details.", ["green", "cream", "minimal", "quiet"]],
    ["floral", "The Memory Journal", "HELD IN OUR HEARTS", "A gentle editorial tribute with a portrait area and space for the name you hold most dear.", ["green", "botanical", "editorial", "tender"]],
    ["champagne", "A Cherished Keepsake", "TOGETHER IN REMEMBRANCE", "An ivory remembrance card with a rectangular portrait mount, a fine gold frame, and a quiet date seal.", ["cream", "gold", "portrait", "keepsake"]],
    ["pichwai", "A Garden in Their Memory", "AMONG FLOWERS, REMEMBERED", "Sage-green garden paper, a gentle candle illustration, and space for a name held close.", ["green", "garden", "nature", "gentle", "quiet"]],
    ["lotus", "A Petal for Every Memory", "A LIFE SOFTLY REMEMBERED", "Blush and rose stationery, a single lotus, and a gathering held with tenderness and quiet grace.", ["pink", "flowers", "gentle", "soft", "tender"]],
    ["royal", "A Life Celebrated", "IN LOVING AND GRATEFUL MEMORY", "Ivory stationery with fine burgundy borders and a dignified invitation to gather and remember together.", ["cream", "traditional", "dignified", "ceremony", "classic"]],
  ],
  other: [
    ["mehfil", "The Supper Poster", "GOOD COMPANY, TOGETHER", "A deep teal gathering poster with marigold artwork, warm gold engraving, and expressive italic type.", ["dark", "teal", "gold", "evening", "dinner"]],
    ["kesar", "The Gathering Gazette", "SOMETHING WORTH SHARING", "A sunny editorial invitation with a bold host line, botanical artwork, and a date column.", ["yellow", "editorial", "bold", "warm", "sunny"]],
    ["modern", "Just Come Over", "AN INVITATION, JUST FOR YOU", "An olive paper keepsake with an arched marigold illustration, botanical corners, and a dated seal.", ["green", "minimal", "keepsake", "warm"]],
    ["royal", "The Grand Occasion", "A PROPER INVITATION", "Ivory and burgundy stationery with fine borders and an invitation that feels made for ceremony.", ["cream", "traditional", "classic", "formal", "elegant"]],
    ["lotus", "An Intimate Gathering", "JUST US, TOGETHER", "Blush paper, gentle floral borders, and an invitation for the people who matter most.", ["pink", "flowers", "intimate", "warm", "soft"]],
    ["ocean", "Something Wonderful", "AN OCCASION TO REMEMBER", "Sea-glass blue paper with a coastal illustration and a fine date column for a gathering to treasure.", ["blue", "coastal", "fresh", "memorable", "modern"]],
  ],
  conference: [
    ["champagne", "The Conference Programme", "AN INVITATION TO THINK BIG", "Dark navy paper, gold type, and a premium event programme feel for a high-impact conference.", ["dark", "navy", "gold", "corporate", "premium"]],
    ["modern", "The Speaker Series", "IDEAS WORTH SHARING", "Clean teal stationery, bold editorial type, and a confident invitation for a professional audience.", ["green", "editorial", "clean", "modern", "professional"]],
    ["ocean", "The Summit Invite", "WHERE IDEAS MEET", "A sea-blue editorial announcement with a strong date column and professional keynote details.", ["blue", "editorial", "bold", "corporate", "modern"]],
    ["royal", "The Business Gathering", "A PROFESSIONAL OCCASION", "Ivory and burgundy stationery with a formal header and clear conference details.", ["cream", "formal", "classic", "professional"]],
    ["mehfil", "The Evening Symposium", "AN EVENING OF IDEAS", "Midnight teal, gold details, and an invitation that makes your evening conference feel unmissable.", ["dark", "evening", "gold", "symposium"]],
    ["pichwai", "The Heritage Summit", "GATHERING THE BRIGHTEST MINDS", "Sage-green stationery with a classic editorial layout for a thoughtful, high-level gathering.", ["green", "classic", "sage", "thoughtful"]],
  ],
  webinar: [
    ["modern", "The Online Session", "JOIN US LIVE", "Clean sage paper, bold digital type, and a link-ready invitation for your next webinar.", ["green", "minimal", "digital", "clean", "online"]],
    ["ocean", "The Virtual Stage", "PRESENTING LIVE", "Sea-blue editorial stationery with a broadcast-bold header and session details at centre stage.", ["blue", "editorial", "broadcast", "bold", "digital"]],
    ["champagne", "The Digital Keynote", "YOUR FRONT-ROW SEAT", "Dark paper with gold type for an online event that deserves a premium invitation.", ["dark", "gold", "premium", "digital", "keynote"]],
    ["kesar", "The Bright Session", "LEARNING, LIVE", "Saffron and warm-cream stationery with bold headline type and clear join details.", ["yellow", "warm", "bold", "learning"]],
    ["pichwai", "The Garden Talk", "IDEAS IN BLOOM", "Sage-green stationery with an editorial layout for a relaxed, thoughtful online conversation.", ["green", "sage", "editorial", "relaxed"]],
    ["floral", "The Live Workshop", "COME LEARN WITH US", "Botanical borders and a warm layout for an online workshop or skills session.", ["green", "botanical", "workshop", "warm"]],
  ],
  "ladies-night": [
    ["lotus", "Girls Night Out", "THE GIRLS ARE GETTING TOGETHER", "Blush paper, sparkling rose gold details, and an invitation for a night that will be talked about for weeks.", ["pink", "rose gold", "fun", "girls", "party"]],
    ["kesar", "The Ladies' Edit", "ONLY THE BEST COMPANY", "Warm saffron paper, big joyful type, and a girls-night invitation full of good energy.", ["yellow", "warm", "bold", "fun", "vibrant"]],
    ["sindoor", "The Night Out Invite", "THE NIGHT IS OURS", "Rich red paper, bold party typography, and an invitation that makes the excitement official.", ["red", "bold", "party", "vibrant", "night"]],
    ["mehfil", "Midnight Magic", "AN EVENING FOR THE GIRLS", "Midnight teal, gold sparkle details, and a party invitation as glamorous as the night itself.", ["dark", "teal", "gold", "glamour", "evening"]],
    ["floral", "The Bloom Party", "FLOWERS, GIRLS & GOOD TIMES", "Sage botanical borders, soft gold accents, and a garden-party invitation full of fun and flowers.", ["green", "flowers", "botanical", "fun", "garden"]],
    ["ocean", "The Beach Girls", "SUN, SEA & GOOD COMPANY", "Sea-glass blue paper with coastal vibes and a breezy invitation for a laid-back girls gathering.", ["blue", "coastal", "breezy", "fun", "beach"]],
  ],
  "virtual-event": [
    ["ocean", "The Virtual Gathering", "CONNECTING ACROSS DISTANCES", "Sea-blue editorial stationery with a digital-first layout for bringing people together online.", ["blue", "digital", "modern", "online", "clean"]],
    ["modern", "The Online Meetup", "SEE YOU ONLINE", "Minimal sage-green stationery, clean type, and a welcoming invitation for a virtual get-together.", ["green", "minimal", "clean", "digital", "simple"]],
    ["champagne", "The Digital Evening", "AN EVENING ONLINE", "Dark paper, gold details, and an invitation that makes your virtual event feel as special as being there.", ["dark", "gold", "premium", "evening", "digital"]],
    ["kesar", "The Virtual Celebration", "TOGETHER, WHEREVER YOU ARE", "Warm saffron paper with big joyful type and a virtual event invite full of good cheer.", ["yellow", "warm", "joyful", "celebration", "online"]],
    ["mehfil", "The Online Soiree", "MEET US IN THE DIGITAL ROOM", "Midnight teal with golden detail — an elegant invitation for a virtual gathering worth attending.", ["dark", "elegant", "gold", "online", "soiree"]],
    ["floral", "The Virtual Garden Party", "GOOD COMPANY, WHEREVER YOU ARE", "Botanical borders and a warm layout for an informal virtual gathering with the people you love.", ["green", "botanical", "warm", "informal", "friendly"]],
  ],
  "kids-birthday": [
    ["kesar", "The Big Birthday Bash", "COME JOIN THE PARTY!", "Sunshine yellow, a giant birthday cake, and a party invitation as fun and loud as the celebration itself.", ["yellow", "fun", "party", "cake", "bright"]],
    ["lotus", "The Birthday Bonanza", "IT'S TIME TO CELEBRATE!", "Blush and rose, a candy-striped cake, and a birthday invite full of colour, joy, and sweetness.", ["pink", "sweet", "fun", "colourful", "cake"]],
    ["ocean", "Adventure Party Invite", "THE BEST DAY EVER STARTS HERE", "Sea-blue paper, a treasure-island layout, and a birthday invitation full of adventure and excitement.", ["blue", "adventure", "fun", "bold", "exciting"]],
    ["floral", "Garden Birthday Party", "COME PLAY IN THE GARDEN", "Botanical borders, a flower-cake illustration, and a sweet outdoor birthday party invitation.", ["green", "garden", "flowers", "outdoor", "sweet"]],
    ["sindoor", "The Colour Carnival", "THE MOST COLOURFUL BIRTHDAY EVER", "Bold red paper with a bright confetti layout and a birthday invite that matches the energy of a kids party.", ["red", "bold", "confetti", "colourful", "carnival"]],
    ["mehfil", "Birthday After Bedtime", "THE NIGHT BIRTHDAY PARTY", "Midnight teal, glowing cake candles, and a birthday invite for the cool kids who party at night.", ["dark", "night", "glow", "cool", "evening"]],
  ],
};

const layouts: OccasionLayout[] = ["signature", "editorial", "keepsake"];

export function getOccasionThemes(occasion: OccasionId = "wedding"): OccasionTheme[] {
  if (occasion === "wedding") return themes.map(theme => ({ ...theme, layout: "signature" }));
  return collections[occasion].map(([id, name, category, description, keywords], index) => ({
    ...themes.find(theme => theme.id === id)!, id, name, category, description,
    number: String(index + 1).padStart(2, "0"), occasions: [occasion], keywords: keywords || [],
    collection: `${occasion} collection`, layout: layouts[index],
  }));
}

// Old saved theme IDs remain usable. New browsing shows only art-directed choices.
export function getOccasionTheme(occasion: OccasionId | undefined, theme: ThemeId): OccasionTheme {
  const collection = getOccasionThemes(occasion);
  const selected = collection.find(item => item.id === theme);
  if (selected) return selected;
  const base = themes.find(item => item.id === theme) || themes[0];
  return { ...base, name: `${collection[0].name} · ${base.name}`, layout: "signature" };
}
