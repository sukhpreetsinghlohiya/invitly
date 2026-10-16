import { demoInvitation } from "./demo-invitation";
import { createOccasionInvitation, getDesign, getOccasion } from "./occasions";
import { weddingMusic } from "./music";
import { applyFestivalPreset, getFestivalPreset } from "./festivals";
import type { FestivalPresetId, Invitation, OccasionId, ThemeId } from "@/types/invitation";

export const occasionCollections: Record<OccasionId, { title: string; description: string; theme: ThemeId; colour: string; names: [string, string]; venue: string; note: string }> = {
  wedding: { title: "The wedding courtyard", description: "Marigolds, music, and every moment of your wedding.", theme: "royal", colour: "#783b37", names: ["Aanya", "Kabir"], venue: "The Palace Gardens", note: "Join us for the wedding ceremony, followed by dinner." },
  engagement: { title: "A promise in bloom", description: "A delicate ring illustration and room for your story.", theme: "lotus", colour: "#864954", names: ["Meher", "Arjun"], venue: "The Garden Terrace", note: "An evening to exchange promises and share a meal with our families." },
  festival: { title: "A celebration, together", description: "Diwali, Holi, Eid, Christmas, Gurpurab and celebrations of your own.", theme: "royal", colour: "#84482c", names: ["The Kapoor family", ""], venue: "Our family courtyard", note: "Join us for a festive meal and an evening of good company." },
  birthday: { title: "A little birthday magic", description: "A floral cake, warm colours, and one lovely day.", theme: "kesar", colour: "#955323", names: ["Ira", ""], venue: "The Courtyard Café", note: "Join us for games, birthday cake, and a relaxed afternoon together." },
  "baby-shower": { title: "A little love on the way", description: "A botanical cradle and a gentle welcome for a growing family.", theme: "floral", colour: "#526c57", names: ["Riya & Aman", ""], venue: "The Mogra Room", note: "An afternoon of good wishes, stories, and tea with our favourite people." },
  housewarming: { title: "Our door is open", description: "A welcoming doorway, warm paper, and your new address.", theme: "pichwai", colour: "#435947", names: ["The Anand family", ""], venue: "Our new home", note: "Come over for lunch and help us fill our new home with memories." },
  naming: { title: "A name full of love", description: "An illustrated cradle and a tender family announcement.", theme: "lotus", colour: "#864954", names: ["Avni", ""], venue: "The Family Courtyard", note: "Please be with us as we share our little one’s name, followed by lunch." },
  anniversary: { title: "Still choosing you", description: "A floral infinity ribbon, treasured photos, and years worth celebrating.", theme: "champagne", colour: "#75603e", names: ["Neena", "Raj"], venue: "The Rose Dining Room", note: "Join us for dinner, a few favourite stories, and time together." },
  remembrance: { title: "A life, remembered", description: "Quiet greenery, clear details, and space for cherished memories.", theme: "modern", colour: "#4d6155", names: ["Dev Sharma", ""], venue: "The Community Hall", note: "A quiet gathering to share memories and honour a life we hold dear." },
  other: { title: "Good company, together", description: "A warm floral invitation for a gathering of your own.", theme: "mehfil", colour: "#283650", names: ["The Kapoor family", ""], venue: "The Garden Pavilion", note: "Spend an evening with us over food, conversation, and good company." },
  conference: { title: "Ideas worth gathering for", description: "A premium conference invitation with bold type and clear session details.", theme: "champagne", colour: "#1e2d3d", names: ["TechSummit 2026", ""], venue: "The Grand Convention Centre", note: "Join us for keynote sessions, workshops, and networking over lunch." },
  webinar: { title: "Your virtual front-row seat", description: "A clean digital invite for your next live online session or webinar.", theme: "modern", colour: "#1a4f70", names: ["Innovation Live", ""], venue: "Online · Zoom / Google Meet", note: "Register your spot and join us live for a session worth your afternoon." },
  "ladies-night": { title: "The girls are getting together", description: "A fun, vibrant invite for a girls night that nobody will want to miss.", theme: "lotus", colour: "#8b2252", names: ["Priya", ""], venue: "The Rooftop Lounge", note: "Dress up, show up, and get ready for the best night of the year." },
  "virtual-event": { title: "Connecting across distances", description: "A fresh digital invitation for bringing people together wherever they are.", theme: "ocean", colour: "#0d4a6b", names: ["The Team", ""], venue: "Online · Video call", note: "Join us from wherever you are — all you need is a good connection." },
  "kids-birthday": { title: "The most fun birthday ever", description: "A colourful kids party invite with cake, games, and pure birthday energy.", theme: "kesar", colour: "#e65100", names: ["Aryan", ""], venue: "The Backyard", note: "Come ready to play games, eat cake, and make some birthday memories!" },
};

const weddingCoverLines: Partial<Record<ThemeId, string>> = {
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

export function occasionDemo(id: OccasionId, theme: ThemeId = "royal", festivalPreset: FestivalPresetId = "custom"): Invitation {
  if (id === "wedding") return { ...demoInvitation, occasion: "wedding", coverText: weddingCoverLines[theme] || "Together with our families", design: { ...getDesign(demoInvitation), music: weddingMusic } };
  if (id === "festival") {
    const invitation = applyFestivalPreset(createOccasionInvitation("festival"), festivalPreset);
    return { ...invitation, slug: `demo-festival-${festivalPreset}`, couple: ["The Kapoor family", ""], initials: "K", city: "Jaipur, Rajasthan", families: ["With our family and friends", ""],
      functions: [{ id: "demo-festival", name: getFestivalPreset(festivalPreset).title, startsAt: "", venue: "Our family courtyard", address: "Civil Lines, Jaipur, Rajasthan", description: "A sample gathering. Add your own date, time and plans before sharing.", dressCode: "", icon: "sparkles", visibility: "public", mapUrl: "" }],
    };
  }
  const content = occasionCollections[id], occasion = getOccasion(id);
  const time = ({ birthday: "16:00", "baby-shower": "15:00", housewarming: "13:00", naming: "11:00", remembrance: "10:00", conference: "09:00", webinar: "17:00", "ladies-night": "20:00", "virtual-event": "19:00", "kids-birthday": "15:00" } as Partial<Record<OccasionId, string>>)[id] ?? "18:00";
  const startsAt = `${demoInvitation.weddingAt.slice(0, 10)}T${time}:00+05:30`;
  return {
    ...createOccasionInvitation(id), slug: `demo-${id}`, couple: content.names,
    initials: content.names.map(name => name[0]).join(""), city: "Jaipur, Rajasthan", weddingAt: startsAt,
    families: [id === "remembrance" ? "With the Sharma family" : "With our family and friends", ""],
    functions: [{ id: `demo-${id}`, name: occasion.schedule, startsAt, venue: content.venue,
      address: "Civil Lines, Jaipur, Rajasthan", description: content.note, dressCode: "", icon: id === "remembrance" ? "heart" : "sparkles", visibility: "public", mapUrl: "" }],
  };
}
