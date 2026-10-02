import { themes, type InvitationTheme } from "@/data/themes";
import type { OccasionId, ThemeId } from "@/types/invitation";

export type OccasionLayout = "signature" | "editorial" | "keepsake";
export type OccasionTheme = InvitationTheme & { layout: OccasionLayout };

type CollectionEntry = [ThemeId, string, string, string];
const collections: Record<Exclude<OccasionId, "wedding">, CollectionEntry[]> = {
  engagement: [
    ["lotus", "The Promise Letter", "A PROMISE IN BLOOM", "A blush love letter, intertwined rings, and two names at its heart."],
    ["royal", "The Engagement Edit", "A NEW CHAPTER", "An asymmetric editorial announcement with a generous portrait and a promise in print."],
    ["floral", "Pressed Promises", "A LITTLE FOREVER", "A framed keepsake, a garden of rings, and a beautifully simple date to remember."],
  ],
  birthday: [
    ["kesar", "The Birthday Ticket", "ONE VERY HAPPY DAY", "A sunshine-yellow party ticket with a perforated detail line, birthday cake, and big joyful type."],
    ["modern", "Birthday, In Print", "YOUR DAY. YOUR EDITION.", "A bold birthday poster with oversized names, a date stamp, and room for a favourite photo."],
    ["ocean", "Birthday Postcard", "SENT WITH A LITTLE MAGIC", "A blue keepsake postcard, a sweet illustration, and all the party details in one place."],
  ],
  "baby-shower": [
    ["floral", "Little Cloud Letter", "A LITTLE LOVE ON THE WAY", "A soft sage letter beneath a sleepy cloud, with arched paper and a gentle welcome."],
    ["lotus", "The Arrival Journal", "A NEW LITTLE CHAPTER", "A blush editorial announcement pairing your words with dreamy moon-and-cloud artwork."],
    ["modern", "Tiny Beginnings", "SMALL MOMENTS. SO MUCH LOVE.", "A quiet cream keepsake, a framed illustration, and a thoughtful note for your people."],
  ],
  housewarming: [
    ["pichwai", "The Open Door", "MAKE YOURSELF AT HOME", "An arched doorway, marigold garlands, and an address card ready to welcome your guests."],
    ["kesar", "New Address Journal", "A PLACE FOR NEW MEMORIES", "A warm terracotta house journal with a bold welcome and the location at centre stage."],
    ["modern", "A Note From Home", "OUR DOOR IS OPEN", "A clean folded-note composition with a framed home portrait and a generous address line."],
  ],
  naming: [
    ["lotus", "A Name in Bloom", "A NAME FULL OF LOVE", "A tender cradle announcement with a generous name, soft rose paper, and room for family wishes."],
    ["floral", "The Little Name Edit", "THE BEGINNING OF A STORY", "An elegant announcement with oversized name typography and a beautifully illustrated cradle."],
    ["modern", "First Little Keepsake", "A MOMENT TO TREASURE", "A framed birth-story card, a quiet date seal, and a timeless family invitation."],
  ],
  anniversary: [
    ["champagne", "Then & Always", "STILL CHOOSING YOU", "A golden album cover, a pair of rings, and two names together inside a fine double frame."],
    ["floral", "The Anniversary Edition", "ANOTHER BEAUTIFUL CHAPTER", "A graceful magazine-style celebration of your shared years, with space for a favourite portrait."],
    ["mehfil", "An Evening, Remembered", "WITH LOVE, THEN AND NOW", "A midnight-blue keepsake with a brass frame, treasured moments, and a dinner-date card."],
  ],
  remembrance: [
    ["modern", "A Life, Remembered", "IN LOVING MEMORY", "An unhurried memorial page with quiet greenery, generous white space, and clearly arranged gathering details."],
    ["floral", "The Memory Journal", "HELD IN OUR HEARTS", "A gentle editorial tribute with a portrait area and space for the name you hold dear."],
    ["champagne", "A Cherished Keepsake", "TOGETHER IN REMEMBRANCE", "A simple ivory remembrance card with a fine frame and a clear invitation to gather."],
  ],
  other: [
    ["mehfil", "The Supper Poster", "GOOD COMPANY, TOGETHER", "An indigo gathering poster with marigold artwork, expressive type, and a warm place at the table."],
    ["kesar", "The Gathering Gazette", "SOMETHING WORTH SHARING", "A sunny editorial invitation with a bold host line, botanical artwork, and a date column."],
    ["modern", "Just Come Over", "AN INVITATION, JUST FOR YOU", "A relaxed paper keepsake, a framed marigold, and a simple personal note for any gathering."],
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
