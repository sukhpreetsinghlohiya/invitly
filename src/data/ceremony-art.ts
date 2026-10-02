export type CeremonyArtId = "haldi" | "sangeet" | "mehndi" | "wedding" | "reception" | "baraat" | "engagement";
export type CeremonyArtwork = {
  id: CeremonyArtId;
  label: string;
  src: string;
  width: number;
  height: number;
  aliases: readonly string[];
};

/** Artwork follows a ceremony the host explicitly names, never their name or religion. */
export const ceremonyArtwork: readonly CeremonyArtwork[] = [
  { id: "haldi", label: "Haldi", src: "/images/ceremonies/haldi.webp", width: 600, height: 450, aliases: ["haldi", "haldee", "हल्दी", "ਹਲਦੀ"] },
  { id: "sangeet", label: "Sangeet", src: "/images/ceremonies/sangeet.webp", width: 600, height: 450, aliases: ["sangeet", "sangit", "संगीत", "ਸੰਗੀਤ"] },
  { id: "mehndi", label: "Mehndi", src: "/images/ceremonies/mehndi.webp", width: 600, height: 450, aliases: ["mehndi", "mehendi", "mehandi", "henna", "मेहंदी", "मेहन्दी", "मेंहदी", "ਮੇਹੰਦੀ", "ਮਹਿੰਦੀ"] },
  { id: "wedding", label: "Wedding", src: "/images/occasions/wedding.webp", width: 480, height: 360, aliases: ["wedding", "shaadi", "shadi", "vivah", "marriage", "pheras", "phere", "शादी", "विवाह", "फेरे", "ਵਿਆਹ", "ਫੇਰੇ"] },
  { id: "reception", label: "Reception", src: "/images/ceremonies/reception.webp", width: 600, height: 450, aliases: ["reception", "रिसेप्शन", "रिसेप्‍शन", "ਰਿਸੈਪਸ਼ਨ", "ਰਿਸੈਪਸ਼ਨ"] },
  { id: "baraat", label: "Baraat", src: "/images/ceremonies/baraat.webp", width: 600, height: 450, aliases: ["baraat", "barat", "बारात", "ਬਰਾਤ"] },
  { id: "engagement", label: "Engagement", src: "/images/occasions/engagement.webp", width: 480, height: 360, aliases: ["engagement", "ring ceremony", "roka", "sagai", "सगाई", "रोका", "ਮੰਗਣੀ", "ਰੋਕਾ"] },
];

function normalizeTitle(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en-IN").replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\s+/g, " ").trim();
}
const wordCharacter = /[\p{L}\p{M}\p{N}]/u;

/** Whole words across Indic scripts. Specific ceremonies beat a generic wedding qualifier. */
export function getCeremonyArt(title: string): CeremonyArtwork | null {
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
  return result;
}
