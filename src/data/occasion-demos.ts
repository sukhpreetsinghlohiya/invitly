import { demoInvitation } from "./demo-invitation";
import { createOccasionInvitation, getDesign, getOccasion } from "./occasions";
import { weddingMusic } from "./music";
import type { Invitation, OccasionId, ThemeId } from "@/types/invitation";

export const occasionCollections: Record<OccasionId, { title: string; description: string; theme: ThemeId; colour: string; names: [string, string]; venue: string; note: string }> = {
  wedding: { title: "The wedding courtyard", description: "Marigolds, music, and every moment of your wedding.", theme: "royal", colour: "#783b37", names: ["Aanya", "Kabir"], venue: "The Palace Gardens", note: "Join us for the wedding ceremony, followed by dinner." },
  engagement: { title: "A promise in bloom", description: "A delicate ring illustration and room for your story.", theme: "lotus", colour: "#864954", names: ["Meher", "Arjun"], venue: "The Garden Terrace", note: "An evening to exchange promises and share a meal with our families." },
  birthday: { title: "A little birthday magic", description: "A floral cake, warm colours, and one lovely day.", theme: "kesar", colour: "#955323", names: ["Ira", ""], venue: "The Courtyard Café", note: "Join us for games, birthday cake, and a relaxed afternoon together." },
  "baby-shower": { title: "A little love on the way", description: "A botanical cradle and a gentle welcome for a growing family.", theme: "floral", colour: "#526c57", names: ["Riya & Aman", ""], venue: "The Mogra Room", note: "An afternoon of good wishes, stories, and tea with our favourite people." },
  housewarming: { title: "Our door is open", description: "A welcoming doorway, warm paper, and your new address.", theme: "pichwai", colour: "#435947", names: ["The Anand family", ""], venue: "Our new home", note: "Come over for lunch and help us fill our new home with memories." },
  naming: { title: "A name full of love", description: "An illustrated cradle and a tender family announcement.", theme: "lotus", colour: "#864954", names: ["Avni", ""], venue: "The Family Courtyard", note: "Please be with us as we share our little one’s name, followed by lunch." },
  anniversary: { title: "Still choosing you", description: "Golden rings, treasured photos, and years worth celebrating.", theme: "champagne", colour: "#75603e", names: ["Neena", "Raj"], venue: "The Rose Dining Room", note: "Join us for dinner, a few favourite stories, and time together." },
  remembrance: { title: "A life, remembered", description: "Quiet greenery, clear details, and space for cherished memories.", theme: "modern", colour: "#4d6155", names: ["Dev Sharma", ""], venue: "The Community Hall", note: "A quiet gathering to share memories and honour a life we hold dear." },
  other: { title: "Good company, together", description: "A warm floral invitation for a gathering of your own.", theme: "mehfil", colour: "#283650", names: ["The Kapoor family", ""], venue: "The Garden Pavilion", note: "Spend an evening with us over food, conversation, and good company." },
};

const weddingCoverLines: Record<ThemeId, string> = {
  royal: "Mehmaan nahi, apne banke aaiye",
  modern: "Hum, aap, aur ek nayi shuruat",
  floral: "Khushiyon ko saath khilne dein",
  mehfil: "Mehfil tab sajegi, jab aap aayenge",
  kesar: "Thodi shararat, dher saari khushiyaan",
  lotus: "Dil ki baat, apno ke saath",
  pichwai: "Aangan mein rang, dil mein khushi",
  ocean: "Naya safar, apno ke sang",
  champagne: "Shaam haseen, saath aapka",
  sindoor: "Dhol, dil, aur dher saara pyaar",
};

export function occasionDemo(id: OccasionId, theme: ThemeId = "royal"): Invitation {
  if (id === "wedding") return { ...demoInvitation, occasion: "wedding", coverText: weddingCoverLines[theme], design: { ...getDesign(demoInvitation), music: weddingMusic } };
  const content = occasionCollections[id], occasion = getOccasion(id);
  const time = ({ birthday: "16:00", "baby-shower": "15:00", housewarming: "13:00", naming: "11:00", remembrance: "10:00" } as Partial<Record<OccasionId, string>>)[id] ?? "18:00";
  const startsAt = `${demoInvitation.weddingAt.slice(0, 10)}T${time}:00+05:30`;
  return {
    ...createOccasionInvitation(id), slug: `demo-${id}`, couple: content.names,
    initials: content.names.map(name => name[0]).join(""), city: "Jaipur, Rajasthan", weddingAt: startsAt,
    families: [id === "remembrance" ? "With the Sharma family" : "With our family and friends", ""],
    functions: [{ id: `demo-${id}`, name: occasion.schedule, startsAt, venue: content.venue,
      address: "Civil Lines, Jaipur, Rajasthan", description: content.note, dressCode: "", icon: id === "remembrance" ? "heart" : "sparkles", visibility: "public", mapUrl: "" }],
  };
}
