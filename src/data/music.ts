import type { InvitationMusic, MusicMood } from "@/types/invitation";

export const musicMoods: { id: MusicMood; name: string; description: string }[] = [
  { id: "santoor", name: "Courtyard strings", description: "Santoor-inspired plucks, a warm drone, an unhurried welcome." },
  { id: "bansuri", name: "Evening breeze", description: "Bansuri-inspired soft tones for a quiet, thoughtful gathering." },
  { id: "celebration", name: "Mehfil rhythm", description: "Bright plucks and a gentle hand-drum pulse for a joyful entrance." },
];
export const defaultMusic: InvitationMusic = { source: "original", track: "santoor", youtubeUrl: "" };

export const recordedTracks = [
  { id: "dulhe-ki-behen-brigade", name: "Dulhe Ki Behen Brigade", description: "A lively soundtrack for the groom’s side and the sangeet.", src: "/audio/dulhe-ki-behen-brigade.mp3" },
] as const;
export const weddingMusic: InvitationMusic = { ...defaultMusic, source: "library", audioTrack: recordedTracks[0].id };

// Official label uploads, verified using YouTube's oEmbed metadata. Keep playback in YouTube's visible player.
export const weddingSongs = [
  { id: "udra3Mfw2oo", name: "London Thumakda", description: "Queen · A joyful family dance", label: "T-Series" },
  { id: "HgIW7P4dsXU", name: "Nachde Ne Saare", description: "Baar Baar Dekho · Mehndi & sangeet", label: "Zee Music Company" },
  { id: "jCEdTq3j-0U", name: "Gallan Goodiyaan", description: "Dil Dhadakne Do · Everyone on the dance floor", label: "T-Series" },
  { id: "4WRJHbL4dAk", name: "Kala Chashma", description: "Baar Baar Dekho · A big celebration entrance", label: "Zee Music Company" },
] as const;

export function recordedTrack(id?: string) { return recordedTracks.find(item => item.id === id); }

/** Only a video ID is ever used to construct an iframe URL. Never accept embed HTML. */
export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    let id: string | null = null;
    if (url.hostname === "youtu.be") id = url.pathname.split("/")[1];
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (/^\/(shorts|embed)\//.test(url.pathname)) id = url.pathname.split("/")[2];
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
