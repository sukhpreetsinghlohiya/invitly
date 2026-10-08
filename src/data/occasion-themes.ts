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
  ],
  engagement: [
    ["lotus", "The Promise Letter", "A PROMISE IN BLOOM", "A garden of antique roses, intertwined rings, and graceful names within a fine double arch on blush paper.", ["pink", "flowers", "gold", "romantic"]],
    ["royal", "The Engagement Edit", "A NEW CHAPTER", "An ivory announcement with generous serif names, a rose-filled illustration, and a burgundy date ribbon.", ["red", "cream", "flowers", "rings", "editorial"]],
    ["floral", "Pressed Promises", "A LITTLE FOREVER", "Watercolor roses and golden rings in a sage portrait mount, with a dated seal and delicate engraved details.", ["green", "cream", "flowers", "botanical"]],
  ],
  birthday: [
    ["kesar", "The Birthday Ticket", "ONE VERY HAPPY DAY", "A sunshine-yellow party ticket with a perforated detail line, birthday cake, and big joyful type."],
    ["modern", "Birthday, In Print", "YOUR DAY. YOUR EDITION.", "A teal birthday edition with oversized type and a floral watercolor cake, ready for your own photo."],
    ["ocean", "Birthday Postcard", "SENT WITH A LITTLE MAGIC", "An airmail-striped border, a floral birthday cake, and a small circular date seal."],
  ],
  "baby-shower": [
    ["floral", "Little Cloud Letter", "A LITTLE LOVE ON THE WAY", "A soft sage letter with a botanical cradle, with arched paper and a gentle welcome."],
    ["lotus", "The Arrival Journal", "A NEW LITTLE CHAPTER", "Apricot paper, flowing serif names, and a floral cradle painting for a new little adventure."],
    ["modern", "Tiny Beginnings", "SMALL MOMENTS. SO MUCH LOVE.", "A cream keepsake with a watercolor cradle illustration, engraved floral corners, and a date seal."],
  ],
  housewarming: [
    ["pichwai", "The Open Door", "MAKE YOURSELF AT HOME", "An arched doorway, marigold garlands, and an address card ready to welcome your guests."],
    ["kesar", "New Address Journal", "A PLACE FOR NEW MEMORIES", "A warm terracotta house journal with a bold welcome and the location at centre stage."],
    ["modern", "A Note From Home", "OUR DOOR IS OPEN", "An olive and cream keepsake with an arched doorway illustration and finely drawn botanical corners."],
  ],
  naming: [
    ["lotus", "A Name in Bloom", "A NAME FULL OF LOVE", "A tender cradle announcement with a generous name, soft rose paper, and room for family wishes."],
    ["floral", "The Little Name Edit", "THE BEGINNING OF A STORY", "An elegant announcement with oversized name typography and a beautifully illustrated cradle."],
    ["modern", "First Little Keepsake", "A MOMENT TO TREASURE", "Soft blue-grey stationery with a cradle illustration, fine floral engraving, and a dated seal."],
  ],
  anniversary: [
    ["champagne", "Then & Always", "STILL CHOOSING YOU", "Deep green paper, a floral infinity ribbon, and a fine double frame around your two names."],
    ["floral", "The Anniversary Edition", "ANOTHER BEAUTIFUL CHAPTER", "A graceful magazine-style celebration of your shared years, with space for a favourite portrait."],
    ["mehfil", "An Evening, Remembered", "WITH LOVE, THEN AND NOW", "A midnight-blue keepsake with brass botanical engraving, a floral infinity ribbon, and a date seal."],
  ],
  remembrance: [
    ["modern", "A Life, Remembered", "IN LOVING MEMORY", "A candle and greenery on warm ivory paper, with an understated border and clear gathering details."],
    ["floral", "The Memory Journal", "HELD IN OUR HEARTS", "A gentle editorial tribute with a portrait area and space for the name you hold dear."],
    ["champagne", "A Cherished Keepsake", "TOGETHER IN REMEMBRANCE", "An ivory remembrance card with a rectangular portrait mount, a fine gold frame, and a quiet date seal."],
  ],
  other: [
    ["mehfil", "The Supper Poster", "GOOD COMPANY, TOGETHER", "A deep teal gathering poster with marigold artwork, warm gold engraving, and expressive italic type."],
    ["kesar", "The Gathering Gazette", "SOMETHING WORTH SHARING", "A sunny editorial invitation with a bold host line, botanical artwork, and a date column."],
    ["modern", "Just Come Over", "AN INVITATION, JUST FOR YOU", "An olive paper keepsake with an arched marigold illustration, botanical corners, and a dated seal."],
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
