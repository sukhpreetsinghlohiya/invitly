import { expect, test } from "@playwright/test";
import { defaultMusic, weddingMusic, youtubeVideoId } from "../src/data/music";
import { parseUploadedAudio } from "../src/lib/audio";
import { audioResponse } from "../src/lib/audio-response";
import { occasionDemo } from "../src/data/occasion-demos";
import { occasions, getDesign } from "../src/data/occasions";
import { themes } from "../src/data/themes";
import { validateInvitationDraft } from "../src/lib/invitation-draft";
import { venueDirectionsLink, venueSearchLink } from "../src/lib/venue";

test("music only accepts supported HTTPS video links and strips tracking parameters", () => {
  for (const url of ["https://youtu.be/M7lc1UVf-VE?si=track", "https://www.youtube.com/watch?v=M7lc1UVf-VE&list=123", "https://music.youtube.com/watch?v=M7lc1UVf-VE"]) expect(youtubeVideoId(url)).toBe("M7lc1UVf-VE");
  for (const url of ["javascript:alert(1)", "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE", "https://user:pass@youtube.com/watch?v=M7lc1UVf-VE", "https://www.youtube.com/playlist?list=123", "http://youtu.be/M7lc1UVf-VE", "https://youtube.com:8443/watch?v=M7lc1UVf-VE"]) expect(youtubeVideoId(url)).toBeNull();
  const invitation = occasionDemo("wedding");
  invitation.design = { ...getDesign(invitation), music: { ...defaultMusic, source: "youtube", youtubeUrl: "https://youtu.be/M7lc1UVf-VE?si=private-tracking" } };
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }).data?.invitation.design?.music?.youtubeUrl).toBe("https://www.youtube.com/watch?v=M7lc1UVf-VE");
  invitation.design.music!.youtubeUrl = "";
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }, "draft").error).toBeUndefined();
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }, "publish").error).toContain("song link");
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: false }, "publish").error).toBeUndefined();
});

test("recordings round-trip through validation and reject unknown files or arbitrary paths", () => {
  const invitation = occasionDemo("wedding");
  invitation.design = { ...getDesign(invitation), music: weddingMusic };
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }).data?.invitation.design?.music).toEqual(weddingMusic);
  invitation.design.music = { ...weddingMusic, audioTrack: "../../secret.mp3" };
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }).error).toContain("available wedding song");
  const uploadedAudio = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", eventId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Our welcome.mp3" };
  invitation.design.music = { ...defaultMusic, source: "upload", uploadedAudio };
  expect(validateInvitationDraft({ invitation, themeId: "royal", musicEnabled: true }).data?.invitation.design?.music?.uploadedAudio).toEqual(uploadedAudio);
  expect(parseUploadedAudio({ ...uploadedAudio, id: "../secret" })).toBeNull();
  expect(parseUploadedAudio({ ...uploadedAudio, eventId: "https://example.com/audio" })).toBeNull();
});

test("private audio supports normal, suffix and invalid byte ranges without caching", async () => {
  const blob = new Blob([new Uint8Array([0, 1, 2, 3, 4])]);
  const full = audioResponse(blob, new Request("https://example.test/audio"));
  expect(full.status).toBe(200);
  expect(full.headers.get("Content-Length")).toBe("5");
  expect(full.headers.get("Cache-Control")).toBe("private, no-store");
  expect(full.headers.get("Accept-Ranges")).toBe("bytes");
  expect([...new Uint8Array(await full.arrayBuffer())]).toEqual([0, 1, 2, 3, 4]);
  for (const [range, expected] of [["bytes=1-3", [1, 2, 3]], ["bytes=-2", [3, 4]], ["bytes=3-", [3, 4]]] as const) {
    const response = audioResponse(blob, new Request("https://example.test/audio", { headers: { Range: range } }));
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Length")).toBe(String(expected.length));
    expect(response.headers.get("Content-Range")).toBe(`bytes ${expected[0]}-${expected[expected.length - 1]}/5`);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual(expected);
  }
  for (const range of ["bytes=9-", "bytes=4-1", "bytes=-0", "bytes=0-1,3-4", "bytes=-"]) expect(audioResponse(blob, new Request("https://example.test/audio", { headers: { Range: range } })).status).toBe(416);
});

test("venue search and directions preserve Unicode and exact shared pins", () => {
  const venue = { venue: "घर & Friends", address: "Sector 17, ਚੰਡੀਗੜ੍ਹ #12" };
  expect(new URL(venueSearchLink(venue)).searchParams.get("query")).toBe("घर & Friends, Sector 17, ਚੰਡੀਗੜ੍ਹ #12");
  expect(new URL(venueDirectionsLink(venue)).searchParams.get("destination")).toBe("घर & Friends, Sector 17, ਚੰਡੀਗੜ੍ਹ #12");
  expect(venueDirectionsLink({ ...venue, mapUrl: "https://maps.app.goo.gl/Example" })).toBe("https://maps.app.goo.gl/Example");
  expect(venueDirectionsLink({ ...venue, mapUrl: "javascript:alert(1)" })).toMatch(/^https:\/\/www.google.com\/maps\/dir/);
});

test("all nine occasion starters validate with every theme and have appropriate schedule copy", () => {
  for (const occasion of occasions) for (const theme of themes) {
    const invitation = occasionDemo(occasion.id);
    expect(validateInvitationDraft({ invitation, themeId: theme.id, musicEnabled: false }).error, `${occasion.id}/${theme.id}`).toBeUndefined();
    if (occasion.id !== "wedding") {
      expect(JSON.stringify(invitation.functions)).not.toMatch(/Haldi|Sunshine yellows|dance moves/);
      expect(invitation.functions[0].startsAt).toBe(invitation.weddingAt);
    }
    if (occasion.id === "remembrance") expect(getDesign(invitation).countdown).toBe(false);
  }
});
