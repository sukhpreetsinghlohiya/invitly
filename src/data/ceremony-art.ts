import type { OccasionId } from "@/types/invitation";
import { getOccasionArtwork } from "@/data/occasion-art";

export type CeremonyArtId = "haldi" | "sangeet" | "mehndi" | "wedding" | "reception" | "baraat" | "engagement" | "festival" | "birthday" | "baby-shower" | "housewarming" | "naming" | "anniversary" | "remembrance" | "other";
export type CeremonyArtwork = {
  id: CeremonyArtId;
  label: string;
  src: string;
  width: number;
  height: number;
  motion?: "ambient";
  aliases: readonly string[];
};

/** Artwork follows a ceremony the host explicitly names, never their name or religion. */
export const ceremonyArtwork: readonly CeremonyArtwork[] = [
  { id: "haldi", label: "Haldi", src: "/images/ceremonies/haldi.webp", width: 600, height: 450, aliases: ["haldi", "haldee", "हल्दी", "ਹਲਦੀ"] },
  { id: "sangeet", label: "Sangeet", src: "/images/ceremonies/sangeet.webp", width: 600, height: 450, aliases: ["sangeet", "sangit", "संगीत", "ਸੰਗੀਤ"] },
  { id: "mehndi", label: "Mehndi", src: "/images/ceremonies/mehndi.webp", width: 600, height: 450, aliases: ["mehndi", "mehendi", "mehandi", "henna", "मेहंदी", "मेहन्दी", "मेंहदी", "ਮੇਹੰਦੀ", "ਮਹਿੰਦੀ"] },
  { id: "wedding", label: "Wedding", ...getOccasionArtwork("wedding"), aliases: ["wedding", "shaadi", "shadi", "vivah", "marriage", "pheras", "phere", "शादी", "विवाह", "फेरे", "ਵਿਆਹ", "ਫੇਰੇ"] },
  { id: "reception", label: "Reception", src: "/images/ceremonies/reception.webp", width: 600, height: 450, aliases: ["reception", "रिसेप्शन", "रिसेप्‍शन", "ਰਿਸੈਪਸ਼ਨ", "ਰਿਸੈਪਸ਼ਨ"] },
  { id: "baraat", label: "Baraat", src: "/images/ceremonies/baraat.webp", width: 600, height: 450, aliases: ["baraat", "barat", "बारात", "ਬਰਾਤ"] },
  { id: "engagement", label: "Engagement", ...getOccasionArtwork("engagement"), aliases: ["engagement", "ring ceremony", "roka", "sagai", "सगाई", "रोका", "ਮੰਗਣੀ", "ਰੋਕਾ"] },
  { id: "festival", label: "Festival gathering", ...getOccasionArtwork("festival"), aliases: ["festival", "diwali", "holi", "eid", "christmas", "gurpurab", "navratri", "ganesh chaturthi"] },
  { id: "birthday", label: "Birthday", ...getOccasionArtwork("birthday"), aliases: ["birthday", "cake cutting", "जन्मदिन", "ਜਨਮਦਿਨ"] },
  { id: "baby-shower", label: "Baby shower", ...getOccasionArtwork("baby-shower"), aliases: ["baby shower", "god bharai", "गोद भराई"] },
  { id: "housewarming", label: "Housewarming", ...getOccasionArtwork("housewarming"), aliases: ["housewarming", "griha pravesh", "grih pravesh", "गृह प्रवेश"] },
  { id: "naming", label: "Naming ceremony", ...getOccasionArtwork("naming"), aliases: ["naming", "naamkaran", "namkaran", "नामकरण", "ਨਾਮਕਰਨ"] },
  { id: "anniversary", label: "Anniversary", ...getOccasionArtwork("anniversary"), aliases: ["anniversary", "सालगिरह", "ਵਰ੍ਹੇਗੰਢ"] },
  { id: "remembrance", label: "Remembrance", src: "/images/occasions/remembrance.webp", width: 480, height: 360, aliases: ["remembrance", "memorial", "श्रद्धांजलि", "ਸ਼ਰਧਾਂਜਲੀ"] },
  { id: "other", label: "Together", ...getOccasionArtwork("other"), aliases: [] },
];

function normalizeTitle(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en-IN").replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\s+/g, " ").trim();
}
const wordCharacter = /[\p{L}\p{M}\p{N}]/u;

/** Whole words across Indic scripts. Specific ceremonies beat a generic wedding qualifier. */
export function getCeremonyArt(title: string, occasion?: OccasionId): CeremonyArtwork | null {
  const normalized = normalizeTitle(title);
  let result: CeremonyArtwork | null = null;
  let earliest = Number.POSITIVE_INFINITY;
  for (const item of ceremonyArtwork) {
    for (const alias of item.aliases) {
      const name = normalizeTitle(alias);
      let index = normalized.indexOf(name);
      while (index !== -1) {
        const before = normalized[index - 1] || "";
        const after = normalized[index + name.length] || "";
        const beatsCurrent = !result || (result.id === "wedding" && item.id !== "wedding") || (result.id !== "wedding" && item.id !== "wedding" && index < earliest);
        if (!wordCharacter.test(before) && !wordCharacter.test(after) && beatsCurrent) {
          result = item;
          earliest = index;
        }
        index = normalized.indexOf(name, index + name.length);
      }
    }
  }
  return result || (occasion && occasion !== "wedding" ? ceremonyArtwork.find(item => item.id === occasion) || null : null);
}
