import type { FestivalPresetId, Invitation } from "@/types/invitation";

type FestivalPreset = { id: FestivalPresetId; name: string; title: string; cover: string; intro: string; message: string };

// Hosts choose these explicitly. A preset never sets a religion, date, name or venue.
export const festivalPresets: readonly FestivalPreset[] = [
  { id: "custom", name: "My own celebration", title: "Festival gathering", cover: "A celebration is lovelier together", intro: "Come celebrate with us.", message: "We’re bringing our favourite people together for food, conversation, and a little festive joy. There’s a place for you at our celebration." },
  { id: "diwali", name: "Diwali", title: "Diwali together", cover: "A little light, a lot of togetherness", intro: "Join us for our Diwali celebration.", message: "Let’s fill the evening with lights, shared sweets, and the warmth of good company. We would love to celebrate Diwali with you." },
  { id: "holi", name: "Holi", title: "Holi with our people", cover: "More colour. More company. More joy.", intro: "You’re invited to celebrate Holi with us.", message: "Bring your brightest smiles for a celebration of colour, good food, and happy moments together. We’re looking forward to having you with us." },
  { id: "eid", name: "Eid", title: "Eid, together", cover: "Good wishes and a place at our table", intro: "Join us for our Eid gathering.", message: "We would love to share the joy of Eid with you. Join our family for a warm welcome, a meal together, and time with the people we cherish." },
  { id: "christmas", name: "Christmas", title: "Christmas at ours", cover: "A warm welcome this Christmas", intro: "Celebrate Christmas with us.", message: "Come share the warmth of the season with good food, familiar stories, and the people who make it special. We’ve saved a place for you." },
  { id: "gurpurab", name: "Gurpurab", title: "Together for Gurpurab", cover: "With gratitude and togetherness", intro: "Please join us for our Gurpurab gathering.", message: "We invite you to be with our family as we mark Gurpurab with gratitude and time together. Your presence will mean so much to us." },
  { id: "navratri", name: "Navratri", title: "Navratri nights", cover: "An evening of rhythm and togetherness", intro: "Come celebrate Navratri with us.", message: "Join us for a festive gathering with music, joyful company, and memories to take home. We would love to share this celebration with you." },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", title: "Ganesh Chaturthi gathering", cover: "A warm invitation from our family", intro: "Join us for our Ganesh Chaturthi celebration.", message: "We warmly invite you to our Ganesh Chaturthi gathering. Let’s share this special time with family, friends, and good wishes." },
];

export function getFestivalPreset(id?: string): FestivalPreset {
  return festivalPresets.find(preset => preset.id === id) || festivalPresets[0];
}

export function getFestival(invitation: Invitation) {
  const preset = getFestivalPreset(invitation.festival?.preset);
  return { preset: preset.id, title: invitation.festival?.title ?? preset.title };
}

/** Only untouched suggestions change. Host wording, schedule and identity stay intact. */
export function applyFestivalPreset(invitation: Invitation, presetId: FestivalPresetId): Invitation {
  const current = getFestivalPreset(invitation.festival?.preset), next = getFestivalPreset(presetId);
  const suggested = (value: string | undefined, before: string, after: string) => value === undefined || value === before ? after : value;
  return {
    ...invitation,
    festival: { preset: next.id, title: suggested(invitation.festival?.title, current.title, next.title) },
    coverText: suggested(invitation.coverText, current.cover, next.cover),
    intro: suggested(invitation.intro, current.intro, next.intro),
    message: suggested(invitation.message, current.message, next.message),
  };
}
