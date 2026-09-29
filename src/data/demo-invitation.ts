import type { Invitation } from "@/types/invitation";

// A fictional celebration. Change this data to edit every theme together.
export const demoInvitation: Invitation = {
  slug: "aanya-and-kabir",
  couple: ["Aanya", "Kabir"],
  initials: "AK",
  intro: "Two hearts. A hundred happy moments.",
  message: "From our first hello to a lifetime of together. Join us, our families, and a very enthusiastic dance floor as we begin our next chapter.",
  families: ["The Sharma family", "The Mehta family"],
  city: "Jaipur, Rajasthan",
  weddingAt: "2027-02-14T18:00:00+05:30",
  timezone: "Asia/Kolkata",
  functions: [
    { id: "haldi", name: "Haldi", description: "A little sunshine, a little mischief, a whole lot of yellow.", startsAt: "2027-02-13T10:30:00+05:30", venue: "The Garden Courtyard", address: "Jai Mahal Palace, Jacob Road, Civil Lines, Jaipur, Rajasthan", dressCode: "Sunshine yellows", icon: "sun" },
    { id: "sangeet", name: "Sangeet", description: "Bring your favourite people and your most questionable dance moves.", startsAt: "2027-02-13T19:00:00+05:30", venue: "The Celebration Lawn", address: "Jai Mahal Palace, Jacob Road, Civil Lines, Jaipur, Rajasthan", dressCode: "A little sparkle", icon: "music" },
    { id: "wedding", name: "Wedding", description: "Under the evening sky, with all the people who make us, us.", startsAt: "2027-02-14T18:00:00+05:30", venue: "The Palace Gardens", address: "Jai Mahal Palace, Jacob Road, Civil Lines, Jaipur, Rajasthan", dressCode: "Indian festive", icon: "heart" },
    { id: "reception", name: "Reception", description: "Stay for dinner, stories, and one more song.", startsAt: "2027-02-14T20:30:00+05:30", venue: "The Durbar Hall", address: "Jai Mahal Palace, Jacob Road, Civil Lines, Jaipur, Rajasthan", dressCode: "Evening elegance", icon: "sparkles" },
  ],
  updates: [
    { id: "welcome", time: "A note from the hosts", message: "We cannot wait to celebrate with you! All four functions, timings, and directions are right here." },
    { id: "travel", time: "Travel note", message: "Arriving in Jaipur? Please allow extra travel time from the airport and check with your hosts for your stay details." },
  ],
};

export function formatEventDate(date: string, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: timezone }).format(new Date(date));
}
