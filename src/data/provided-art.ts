/** Selected from the project owner's Canva references; original pixel sizes are preserved. */
export const providedArtwork = {
  goldRings: { id: "gold-rings", src: "/images/stationery/gold-wedding-rings.webp", width: 550, height: 263 },
  joinedHands: { id: "joined-hands", src: "/images/stationery/joined-hands.webp", width: 550, height: 335 },
  varmala: { id: "varmala", src: "/images/stationery/varmala-couple.webp", width: 522, height: 550 },
  doves: { id: "doves", src: "/images/stationery/white-doves.webp", width: 550, height: 413 },
  ringDivider: { id: "ring-divider", src: "/images/stationery/ring-line-divider.webp", width: 550, height: 110 },
  floralInfinity: { id: "floral-infinity", src: "/images/stationery/floral-infinity.webp", width: 550, height: 347 },
} as const;

export type ProvidedArtwork = (typeof providedArtwork)[keyof typeof providedArtwork];
