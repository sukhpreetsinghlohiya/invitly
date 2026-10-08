import { weddingSongs } from "@/data/music";

export const songLanguages = [
  { id: "all", name: "All" },
  { id: "punjabi", name: "Punjabi" },
  { id: "hindi", name: "Hindi · Bollywood" },
  { id: "english", name: "English" },
] as const;
export const songMoods = ["Romantic", "Celebration", "Relaxed"] as const;
export type SongLanguage = (typeof songLanguages)[number]["id"];
export type SongMood = (typeof songMoods)[number];
export type CatalogSong = { id: string; name: string; artist: string; label: string; language: Exclude<SongLanguage, "all">; mood: SongMood; description: string };

const weddingArtists: Record<string, string> = {
  udra3Mfw2oo: "Labh Janjua, Sonu Kakkar & Neha Kakkar",
  HgIW7P4dsXU: "Jasleen Royal, Harshdeep Kaur & Siddharth Mahadevan",
  "jCEdTq3j-0U": "Shankar Mahadevan, Farhan Akhtar & ensemble",
  "4WRJHbL4dAk": "Amar Arshi, Badshah & Neha Kakkar",
};

// Official artist/label video pages checked 8 October 2026. These are links,
// not audio assets: playback stays in the visible, guest-initiated YouTube player.
// Provider availability and embedding permissions can change by region.
export const songCatalog: readonly CatalogSong[] = [
  ...weddingSongs.map(song => ({ ...song, artist: weddingArtists[song.id], language: "hindi" as const, mood: "Celebration" as const })),
  { id: "6mr4cYJ7yew", name: "Kesariya", artist: "Arijit Singh & Antara Mitra", label: "Sony Music India", language: "hindi", mood: "Romantic", description: "Brahmāstra · Film version" },
  { id: "mH_LFkWxpI0", name: "Lover", artist: "Diljit Dosanjh", label: "Diljit Dosanjh", language: "punjabi", mood: "Romantic", description: "MoonChild Era · A warm, playful welcome" },
  { id: "mZQH8CPQ-wo", name: "With You", artist: "AP Dhillon", label: "AP Dhillon", language: "punjabi", mood: "Relaxed", description: "An easygoing soundtrack for time together" },
  { id: "ggJMQHltiQc", name: "Diamond", artist: "Gurnam Bhullar", label: "Jass Records", language: "punjabi", mood: "Celebration", description: "A bright Punjabi celebration" },
  { id: "2Vv-BfVoq4g", name: "Perfect", artist: "Ed Sheeran", label: "Ed Sheeran", language: "english", mood: "Romantic", description: "A gentle choice for a love story" },
  { id: "rtOvBOTyX00", name: "A Thousand Years", artist: "Christina Perri", label: "Christina Perri", language: "english", mood: "Romantic", description: "A piano-led, unhurried welcome" },
  { id: "GxldQ9eX2wo", name: "Until I Found You", artist: "Stephen Sanchez", label: "Stephen Sanchez", language: "english", mood: "Relaxed", description: "A little vintage warmth" },
];

export function catalogSong(id?: string | null) { return songCatalog.find(song => song.id === id); }
export function songUrl(song: Pick<CatalogSong, "id">) { return `https://www.youtube.com/watch?v=${song.id}`; }

export function filterSongs({ language = "all", mood = "all", query = "" }: { language?: SongLanguage; mood?: SongMood | "all"; query?: string } = {}) {
  const terms = query.trim().toLocaleLowerCase("en-IN").split(/\s+/).filter(Boolean);
  return songCatalog.filter(song => {
    if (language !== "all" && song.language !== language) return false;
    if (mood !== "all" && song.mood !== mood) return false;
    const content = `${song.name} ${song.artist} ${song.label} ${song.description} ${song.mood} ${song.language} ${song.language === "hindi" ? "bollywood" : ""}`.toLocaleLowerCase("en-IN");
    return terms.every(term => content.includes(term));
  });
}
