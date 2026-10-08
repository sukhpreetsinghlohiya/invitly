import { expect, test } from "@playwright/test";
import { catalogSong, filterSongs, songCatalog, songLanguages, songUrl } from "../src/data/song-catalog";
import { defaultMusic, youtubeVideoId } from "../src/data/music";
import { occasionDemo } from "../src/data/occasion-demos";
import { getDesign } from "../src/data/occasions";
import { validateInvitationDraft } from "../src/lib/invitation-draft";

test("each song language offers at least three distinct supported YouTube links", () => {
  expect(new Set(songCatalog.map(song => song.id)).size).toBe(songCatalog.length);
  for (const language of songLanguages.filter(item => item.id !== "all")) expect(filterSongs({ language: language.id }).length, language.name).toBeGreaterThanOrEqual(3);
  for (const song of songCatalog) {
    expect(youtubeVideoId(songUrl(song))).toBe(song.id);
    expect(song.artist).toBeTruthy();
    expect(song.label).toBeTruthy();
    expect(catalogSong(song.id)).toEqual(song);
  }
  expect(catalogSong("unknown")).toBeUndefined();
});

test("song search combines artist or film words with the chosen language and mood", () => {
  expect(filterSongs({ language: "punjabi", query: "  DILJIT   lover " }).map(song => song.name)).toEqual(["Lover"]);
  expect(filterSongs({ language: "english", mood: "Romantic", query: "sheeran" }).map(song => song.name)).toEqual(["Perfect"]);
  expect(filterSongs({ language: "hindi", query: "Queen" }).map(song => song.name)).toEqual(["London Thumakda"]);
  expect(filterSongs({ language: "punjabi", query: "sheeran" })).toEqual([]);
  expect(filterSongs({ mood: "Celebration" }).every(song => song.mood === "Celebration")).toBe(true);
});

test("every catalog choice survives saved draft validation using the existing YouTube player contract", () => {
  for (const song of songCatalog) {
    const invitation = occasionDemo("wedding");
    invitation.design = { ...getDesign(invitation), music: { ...defaultMusic, source: "youtube", youtubeUrl: songUrl(song) } };
    const saved = validateInvitationDraft({ themeId: "royal", musicEnabled: true, invitation });
    expect(saved.error, song.name).toBeUndefined();
    expect(saved.data?.invitation.design?.music?.source).toBe("youtube");
    expect(saved.data?.invitation.design?.music?.youtubeUrl).toBe(songUrl(song));
  }
});
