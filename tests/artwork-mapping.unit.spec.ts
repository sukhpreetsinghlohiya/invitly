import { expect, test } from "@playwright/test";
import { getCeremonyArt } from "../src/data/ceremony-art";

test("shared anniversary artwork preserves ceremony identity for titles and occasion fallbacks", () => {
  for (const art of [getCeremonyArt("Anniversary dinner"), getCeremonyArt("सालगिरह"), getCeremonyArt("Family dinner", "anniversary")]) {
    expect(art?.id).toBe("anniversary");
    expect(art?.src).toBe("/images/stationery/floral-infinity.webp");
    expect(art?.motion).toBe("ambient");
  }
});
