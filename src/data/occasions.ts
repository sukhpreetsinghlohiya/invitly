import type { Invitation, InvitationDesign, OccasionId, TraditionId } from "@/types/invitation";
import { venueDirectionsLink } from "@/lib/venue";
import { defaultMusic, weddingMusic } from "@/data/music";

export const occasions: { id: OccasionId; name: string; people: 1 | 2; firstLabel: string; secondLabel?: string; cover: string; intro: string; message: string; schedule: string; signoff: string }[] = [
  { id: "wedding", name: "Wedding", people: 2, firstLabel: "First name", secondLabel: "Second name", cover: "Together with our families", intro: "Join us as we begin our life together.", message: "With the love of our families and friends, we invite you to share in our wedding. Your presence will make this day even more special.", schedule: "Wedding ceremony", signoff: "With love and gratitude" },
  { id: "engagement", name: "Engagement", people: 2, firstLabel: "First name", secondLabel: "Second name", cover: "A promise to grow together", intro: "A new chapter begins.", message: "Please join us as we exchange promises and celebrate our engagement with the people closest to our hearts.", schedule: "Engagement", signoff: "With love from our families" },
  { id: "birthday", name: "Birthday", people: 1, firstLabel: "Birthday person’s name", cover: "Another year, another reason to smile", intro: "You’re invited to a birthday celebration!", message: "Let’s make some happy memories together. Join us for a birthday filled with laughter, good company, and a little cake.", schedule: "Birthday celebration", signoff: "See you there!" },
  { id: "baby-shower", name: "Baby shower", people: 1, firstLabel: "Parent or parents’ names", cover: "A little love is on the way", intro: "Join us for a baby shower.", message: "We’re gathering our favourite people to welcome a new chapter for our growing family. We would love to share this special day with you.", schedule: "Baby shower", signoff: "With love from our growing family" },
  { id: "housewarming", name: "Housewarming", people: 1, firstLabel: "Host or family name", cover: "New home. Familiar faces.", intro: "Help us make our house a home.", message: "Our new home will feel complete with the people we love in it. Please join us for a warm welcome and time together.", schedule: "Housewarming gathering", signoff: "Our door is open to you" },
  { id: "naming", name: "Naming ceremony", people: 1, firstLabel: "Baby’s name or family name", cover: "A name, a beginning, a world of love", intro: "A special day for our little one.", message: "Join our family as we celebrate our child’s naming ceremony and share our hopes for the years ahead.", schedule: "Naming ceremony", signoff: "With love from our family" },
  { id: "anniversary", name: "Anniversary", people: 2, firstLabel: "First name", secondLabel: "Second name", cover: "Celebrating the years, cherishing the moments", intro: "A life of memories, a day to celebrate.", message: "Please join us as we mark another chapter of our journey together, surrounded by the family and friends who have been part of it.", schedule: "Anniversary gathering", signoff: "With love, then and always" },
  { id: "remembrance", name: "Memorial / remembrance", people: 1, firstLabel: "Name of the person remembered", cover: "In loving memory", intro: "Remembering a life that touched us all.", message: "We invite you to gather with us to honour a cherished life, share memories, and find comfort in one another’s company.", schedule: "Remembrance gathering", signoff: "With love and remembrance" },
  { id: "other", name: "Other gathering", people: 1, firstLabel: "Host, celebrant, or gathering name", cover: "An invitation, just for you", intro: "We would love you to join us.", message: "Please join us for a special gathering with family and friends. We look forward to spending this time together.", schedule: "Our gathering", signoff: "With warm regards" },
];

// These are host-chosen preferences, never inferred from personal information.
// No sacred symbol or religious phrase is automatically added to an invitation.
export const traditions: { id: TraditionId; name: string }[] = [
  { id: "neutral", name: "Neutral / non-religious" }, { id: "hindu", name: "Hindu" },
  { id: "sikh", name: "Sikh" }, { id: "muslim", name: "Muslim" }, { id: "christian", name: "Christian" },
  { id: "jain", name: "Jain" }, { id: "buddhist", name: "Buddhist" }, { id: "parsi", name: "Parsi / Zoroastrian" },
  { id: "interfaith", name: "Interfaith / mixed traditions" }, { id: "other", name: "Another tradition / custom" },
];

export const defaultDesign: InvitationDesign = { palette: "original", typography: "original", decoration: true, countdown: true, rsvp: true, sectionOrder: ["story", "schedule", "photos", "rsvp", "updates"], motion: "gentle", music: defaultMusic };
export const sectionLabels = { story: "Story & family", schedule: "Schedule", photos: "Photos", rsvp: "RSVP", updates: "Guest notes" };
export function getOccasion(id?: string) { return occasions.find(item => item.id === id) || occasions[0]; }
export function isRemembrance(invitation: Invitation) { return invitation.occasion === "remembrance"; }
export function getDesign(invitation: Invitation): InvitationDesign { return { ...defaultDesign, ...invitation.design, countdown: !isRemembrance(invitation) && (invitation.design?.countdown ?? true) }; }
export function invitationNames(invitation: Invitation) { return invitation.couple.filter(Boolean).join(" & "); }
export function invitationDirections(event: Invitation["functions"][number]) { return venueDirectionsLink(event); }

export function guestWording(invitation: Invitation) {
  const occasion = getOccasion(invitation.occasion);
  const romantic = ["wedding", "engagement", "anniversary"].includes(occasion.id);
  const remembrance = occasion.id === "remembrance";
  return {
    romantic, remembrance,
    cover: invitation.coverText ?? occasion.cover,
    story: remembrance ? "A life remembered." : romantic ? "Our story, together." : "A moment to share.",
    schedule: remembrance ? "Our gathering" : "The celebrations",
    scheduleIntro: remembrance ? "Time together to remember, reflect, and honour." : "We look forward to sharing these moments with you.",
    photos: remembrance ? "Treasured memories." : "Our favourite moments.",
    rsvp: remembrance ? "Join us in remembrance." : "We would love to see you.",
    rsvpIntro: remembrance ? "Let us know if you can be with us for this gathering." : "Let us know if you can join us. Your presence means so much.",
    closing: invitation.closingText ?? occasion.signoff,
  };
}

export function applyOccasion(invitation: Invitation, occasion: OccasionId): Invitation {
  const current = getOccasion(invitation.occasion), next = getOccasion(occasion);
  const replaceSuggested = (value: string | undefined, before: string, after: string) => value === undefined || value === before ? after : value;
  return {
    ...invitation, occasion,
    intro: replaceSuggested(invitation.intro, current.intro, next.intro),
    message: replaceSuggested(invitation.message, current.message, next.message),
    coverText: replaceSuggested(invitation.coverText, current.cover, next.cover),
    closingText: replaceSuggested(invitation.closingText, current.signoff, next.signoff),
    design: { ...getDesign(invitation), countdown: occasion === "remembrance" ? false : getDesign(invitation).countdown },
  };
}

export function createOccasionInvitation(occasion: OccasionId = "wedding"): Invitation {
  const config = getOccasion(occasion);
  return {
    occasion, tradition: "neutral", traditionLabel: "", blessing: "", coverText: config.cover, closingText: config.signoff,
    design: { ...defaultDesign, music: occasion === "wedding" ? weddingMusic : defaultMusic, countdown: occasion !== "remembrance", sectionOrder: [...defaultDesign.sectionOrder] },
    slug: "my-invitation", couple: ["", ""], initials: "", families: ["", ""], intro: config.intro, message: config.message,
    city: "", weddingAt: "", timezone: "Asia/Kolkata", functions: [], updates: [],
  };
}
