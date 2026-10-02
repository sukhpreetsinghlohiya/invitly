// Add Invitly's public profile URLs here. Blank URLs stay visible but inactive.
export const siteSocials = [
  { id: "instagram", name: "Instagram", url: "" },
  { id: "facebook", name: "Facebook", url: "" },
  { id: "youtube", name: "YouTube", url: "" },
  { id: "x", name: "X", url: "" },
  { id: "linkedin", name: "LinkedIn", url: "" },
] as const;

export type SocialId = typeof siteSocials[number]["id"];
