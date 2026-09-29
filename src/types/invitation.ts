export type ThemeId = "royal" | "floral" | "modern" | "mehfil" | "kesar" | "lotus" | "pichwai" | "ocean" | "champagne" | "sindoor";

export type Invitation = {
  slug: string;
  couple: [string, string];
  initials: string;
  intro: string;
  message: string;
  families: [string, string];
  city: string;
  weddingAt: string;
  timezone: string;
  functions: {
    id: string;
    name: string;
    description: string;
    startsAt: string;
    venue: string;
    address: string;
    dressCode: string;
    icon: "sun" | "music" | "heart" | "sparkles";
  }[];
  updates: { id: string; time: string; message: string }[];
};
