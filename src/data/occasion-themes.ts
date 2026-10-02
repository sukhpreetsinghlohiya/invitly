import { themes, type InvitationTheme } from "@/data/themes";
import type { OccasionId, ThemeId } from "@/types/invitation";

export type OccasionLayout = "signature" | "editorial" | "keepsake";
export type OccasionTheme = InvitationTheme & { layout: OccasionLayout };

type CollectionEntry = [ThemeId, string, string, string];
const collections: Record<Exclude<OccasionId, "wedding">, CollectionEntry[]> = {
  engagement: [
    ["lotus", "The Promise Letter", "A PROMISE IN BLOOM", "Blush stationery with a burgundy edge, intertwined rings, and delicate engraved flowers."],
    ["royal", "The Engagement Edit", "A NEW CHAPTER", "A cream and rose announcement with expressive serif names, an illustrated panel, and a date column."],
    ["floral", "Pressed Promises", "A LITTLE FOREVER", "Sage paper, a garden-ring illustration in an arched mount, and a dated keepsake seal."],
  ],
  birthday: [
    ["kesar", "The Birthday Ticket", "ONE VERY HAPPY DAY", "A sunshine-yellow party ticket with a perforated detail line, birthday cake, and big joyful type."],
    ["modern", "Birthday, In Print", "YOUR DAY. YOUR EDITION.", "A teal birthday edition with oversized type and a vintage balloon engraving, ready for your own photo."],
    ["ocean", "Birthday Postcard", "SENT WITH A LITTLE MAGIC", "An airmail-striped border, birthday cake and balloons, and a small circular date seal."],
  ],
  "baby-shower": [
    ["floral", "Little Cloud Letter", "A LITTLE LOVE ON THE WAY", "A soft sage letter beneath a sleepy cloud, with arched paper and a gentle welcome."],
    ["lotus", "The Arrival Journal", "A NEW LITTLE CHAPTER", "Apricot paper, flowing serif names, and an antique balloon drawing for a new little adventure."],
    ["modern", "Tiny Beginnings", "SMALL MOMENTS. SO MUCH LOVE.", "A cream keepsake with a moon-and-cloud illustration, engraved floral corners, and a date seal."],
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
    ["champagne", "Then & Always", "STILL CHOOSING YOU", "Deep green paper, golden rings and lettering, and a fine double frame around your two names."],
    ["floral", "The Anniversary Edition", "ANOTHER BEAUTIFUL CHAPTER", "A graceful magazine-style celebration of your shared years, with space for a favourite portrait."],
    ["mehfil", "An Evening, Remembered", "WITH LOVE, THEN AND NOW", "A midnight-blue keepsake with brass botanical engraving, a floral ring portrait, and a date seal."],
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
  return collections[occasion].map(([id, name, category, description], index) => ({
    ...themes.find(theme => theme.id === id)!, id, name, category, description,
    number: String(index + 1).padStart(2, "0"), occasions: [occasion],
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
