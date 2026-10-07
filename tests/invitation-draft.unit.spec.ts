import { expect, test } from "@playwright/test";
import { demoInvitation } from "../src/data/demo-invitation";
import { applyOccasion, createOccasionInvitation } from "../src/data/occasions";
import { themes } from "../src/data/themes";
import { isValidInvitationDate, validateInvitationDraft, type InvitationDraft } from "../src/lib/invitation-draft";
import { parseInvitationVideo } from "../src/lib/invitation-video";

const makeDraft = (): InvitationDraft => ({ themeId: "royal", invitation: structuredClone(demoInvitation), musicEnabled: false });

test("the host's tradition-symbol choice survives draft validation and rejects invalid settings", () => {
  const draft = validateInvitationDraft(makeDraft()).data!;
  draft.invitation.tradition = "sikh";
  draft.invitation.design!.traditionSymbol = false;
  const saved = validateInvitationDraft(draft);
  expect(saved.error).toBeUndefined();
  expect(saved.data?.invitation.tradition).toBe("sikh");
  expect(saved.data?.invitation.design?.traditionSymbol).toBe(false);
  expect(validateInvitationDraft({ ...draft, invitation: { ...draft.invitation, design: { ...draft.invitation.design, traditionSymbol: "false" } } }).error).toContain("tradition symbol");
});

test("portrait cards and optional invitation sections survive validation without changing legacy drafts", () => {
  const legacy = validateInvitationDraft(makeDraft());
  expect(legacy.error).toBeUndefined();
  expect(legacy.data?.invitation.personProfiles).toBeUndefined();
  expect(legacy.data?.invitation.profileSection).toBeUndefined();
  expect(legacy.data?.invitation.countdownAt).toBeUndefined();
  expect(legacy.data?.invitation.video).toBeUndefined();
  expect(legacy.data?.invitation.design?.rsvp).toBe(true);
  const draft = makeDraft();
  draft.invitation.profileSection = { heading: "हमारी कहानी · ਸਾਡੀ ਕਹਾਣੀ", showPhotos: false };
  draft.invitation.personProfiles = [
    { photoId: "11111111-1111-4111-a111-111111111111", grandparents: "Harjit Kaur & Manjeet Singh", parentsPrefix: "Child of", grandparentsPrefix: "Grandchild of" },
    { photoId: "", grandparents: "सरला और मोहन", parentsPrefix: "", grandparentsPrefix: "" },
  ];
  draft.invitation.countdownAt = "2027-02-13T10:30:00+05:30";
  draft.invitation.design = { ...legacy.data!.invitation.design!, rsvp: false, opening: { style: "envelope", icon: "flower", line: "A letter for our favourite people" } };
  draft.invitation.video = { enabled: true, url: "https://youtu.be/M7lc1UVf-VE", title: "The story so far" };
  const result = validateInvitationDraft(draft);
  expect(result.error).toBeUndefined();
  expect(result.data?.invitation.personProfiles).toEqual(draft.invitation.personProfiles);
  expect(result.data?.invitation.profileSection).toEqual(draft.invitation.profileSection);
  expect(result.data?.invitation.couple).toEqual(draft.invitation.couple);
  expect(result.data?.invitation.families).toEqual(draft.invitation.families);
  expect(result.data?.invitation.countdownAt).toBe("2027-02-13T05:00:00.000Z");
  expect(result.data?.invitation.design?.opening).toEqual(draft.invitation.design.opening);
  expect(result.data?.invitation.design?.rsvp).toBe(false);
  expect(result.data?.invitation.video?.url).toBe("https://www.youtube.com/watch?v=M7lc1UVf-VE");
  draft.invitation.profileSection.heading = "";
  draft.invitation.countdownAt = "";
  const blank = validateInvitationDraft(draft);
  expect(blank.data?.invitation.profileSection?.heading).toBe("");
  expect(blank.data?.invitation.countdownAt).toBe("");
});

test("profile references, prefixes and new section choices reject malformed values", () => {
  const base = makeDraft();
  const invalid = [
    { personProfiles: [{}] }, { personProfiles: [null, {}] },
    { personProfiles: [{ photoId: "https://example.com/a.jpg" }, {}] },
    { personProfiles: [{ grandparents: "x".repeat(241) }, {}] },
    { personProfiles: [{ parentsPrefix: "x".repeat(61) }, {}] },
    { profileSection: { showPhotos: "yes" } }, { profileSection: { heading: "x".repeat(121) } },
    { countdownAt: "2027-02-30T12:00:00Z" },
    { design: { ...validateInvitationDraft(base).data!.invitation.design, rsvp: "yes" } },
    { design: { ...validateInvitationDraft(base).data!.invitation.design, opening: { style: "javascript", icon: "flower", line: "" } } },
    { video: { enabled: true, url: "https://evil.example/embed/movie" } },
  ];
  for (const patch of invalid) expect(validateInvitationDraft({ ...base, invitation: { ...base.invitation, ...patch } }).error).toBeTruthy();
  const extra = validateInvitationDraft({ ...base, invitation: { ...base.invitation, personProfiles: [{ photoId: "", grandparents: "", unsafeHtml: "<script>" }, {}] } });
  expect(extra.data?.invitation.personProfiles?.[0]).not.toHaveProperty("unsafeHtml");
  const unfinished = { ...base, invitation: { ...base.invitation, video: { enabled: true, url: "" } } };
  expect(validateInvitationDraft(unfinished, "draft").error).toBeUndefined();
  expect(validateInvitationDraft(unfinished, "publish").error).toContain("video link");
});

test("only supported HTTPS video IDs become click-to-load embed URLs", () => {
  const youtube = parseInvitationVideo("https://www.youtube.com/watch?v=M7lc1UVf-VE&t=20");
  expect(youtube?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=0&rel=0");
  const vimeo = parseInvitationVideo("https://vimeo.com/123456789/abcdef1234");
  expect(vimeo?.externalUrl).toBe("https://vimeo.com/123456789/abcdef1234");
  expect(vimeo?.embedUrl).toContain("https://player.vimeo.com/video/123456789?");
  expect(vimeo?.embedUrl).toContain("autoplay=0");
  expect(vimeo?.embedUrl).toContain("h=abcdef1234");
  for (const url of ["javascript:alert(1)", "http://vimeo.com/123456789", "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE", "https://user:pass@vimeo.com/123456789", "https://vimeo.com/123456789?h=<script>", "https://vimeo.com/channels/anything", "<iframe src='https://vimeo.com/123456789'>"]) expect(parseInvitationVideo(url), url).toBeNull();
});

test("all available themes accept an editable wedding with English, Hindi and Punjabi", () => {
  for (const theme of themes) {
    const draft = makeDraft();
    draft.themeId = theme.id;
    draft.invitation.couple = ["सिमरन", "ਕਬੀਰ"];
    draft.invitation.message = "सप्रेम आमंत्रण — ਜੀ ਆਇਆਂ ਨੂੰ — with love from both our families.";
    const result = validateInvitationDraft(draft);
    expect(result.error).toBeUndefined();
    expect(result.data?.invitation.couple).toEqual(["सिमरन", "ਕਬੀਰ"]);
    expect(result.data?.themeId).toBe(theme.id);
  }
});

test("calendar validation rejects normalized impossible dates and invalid offsets", () => {
  for (const date of ["2027-02-29T18:00:00+05:30", "2027-02-31T18:00:00+05:30", "2027-04-31T18:00:00+05:30", "2027-02-14T24:00:00+05:30", "2027-02-14T18:00:00+14:30", "2027-02-14T18:00:00+05:99", "2027-02-14T18:00:00"]) {
    expect(isValidInvitationDate(date), date).toBe(false);
    const draft = makeDraft();
    draft.invitation.weddingAt = date;
    expect(validateInvitationDraft(draft).error, date).toBeTruthy();
  }
  expect(isValidInvitationDate("2028-02-29T18:00:00+05:30")).toBe(true);
  expect(isValidInvitationDate("2027-02-14T12:30:00.000Z")).toBe(true);
});

test("malformed input receives a validation error instead of throwing", () => {
  for (const input of [undefined, null, true, [], "invitation", {}, { themeId: "royal" }, { ...makeDraft(), invitation: null }, { ...makeDraft(), musicEnabled: "true" }]) {
    expect(validateInvitationDraft(input).error).toBeTruthy();
  }
});

test("invalid theme, timezone, link names, overlong text and control characters are rejected", () => {
  const invalidDrafts: unknown[] = [
    { ...makeDraft(), themeId: "missing-theme" },
    { ...makeDraft(), invitation: { ...demoInvitation, timezone: "Nowhere/Invalid" } },
    { ...makeDraft(), invitation: { ...demoInvitation, slug: "../private" } },
    { ...makeDraft(), invitation: { ...demoInvitation, slug: "two--hyphens" } },
    { ...makeDraft(), invitation: { ...demoInvitation, couple: ["x".repeat(61), "Kabir"] } },
    { ...makeDraft(), invitation: { ...demoInvitation, message: "x".repeat(5001) } },
    { ...makeDraft(), invitation: { ...demoInvitation, intro: "Unexpected\u0000null" } },
  ];
  for (const draft of invalidDrafts) expect(validateInvitationDraft(draft).error).toBeTruthy();
});

test("duplicate IDs and oversized function/update collections are rejected", () => {
  const duplicateFunction = makeDraft();
  duplicateFunction.invitation.functions[1].id = duplicateFunction.invitation.functions[0].id;
  expect(validateInvitationDraft(duplicateFunction).error).toContain("unique ID");
  const duplicateUpdate = makeDraft();
  duplicateUpdate.invitation.updates[1].id = duplicateUpdate.invitation.updates[0].id;
  expect(validateInvitationDraft(duplicateUpdate).error).toContain("unique ID");
  const empty = makeDraft();
  empty.invitation.functions = [];
  expect(validateInvitationDraft(empty).error).toBeUndefined();
  const tooMany = makeDraft();
  tooMany.invitation.functions = Array.from({ length: 101 }, (_, index) => ({ ...demoInvitation.functions[0], id: `function-${index}` }));
  expect(validateInvitationDraft(tooMany).error).toBeTruthy();
  const tooManyUpdates = makeDraft();
  tooManyUpdates.invitation.updates = Array.from({ length: 21 }, (_, index) => ({ ...demoInvitation.updates[0], id: `update-${index}` }));
  expect(validateInvitationDraft(tooManyUpdates).error).toBeTruthy();
});

test("saved data uses only allowed fields and enforces the UTF-8 payload budget", () => {
  const extraFields = { ...makeDraft(), owner_id: "forged-owner", invitation: { ...demoInvitation, owner_id: "forged-owner", is_published: true } };
  const result = validateInvitationDraft(extraFields);
  expect(result.error).toBeUndefined();
  expect(result.data).not.toHaveProperty("owner_id");
  expect(result.data?.invitation).not.toHaveProperty("owner_id");
  expect(result.data?.invitation).not.toHaveProperty("is_published");
  const oversized = makeDraft();
  oversized.invitation.message = "अ".repeat(5000);
  oversized.invitation.functions = Array.from({ length: 12 }, (_, index) => ({ ...demoInvitation.functions[0], id: `function-${index}`, description: "अ".repeat(1000) }));
  oversized.invitation.updates = Array.from({ length: 20 }, (_, index) => ({ ...demoInvitation.updates[0], id: `update-${index}`, message: "ਅ".repeat(1000) }));
  expect(validateInvitationDraft(oversized).error).toContain("too long");
});


test("incomplete drafts save but cannot publish, single-person occasions need only one name", () => {
  const draft = makeDraft();
  draft.invitation.couple = ["", ""]; draft.invitation.weddingAt = ""; draft.invitation.city = ""; draft.invitation.functions = [];
  expect(validateInvitationDraft(draft, "draft").error).toBeUndefined();
  expect(validateInvitationDraft(draft, "publish").error).toBeTruthy();
  const birthday = makeDraft(); birthday.invitation.occasion = "birthday"; birthday.invitation.couple = ["Aanya", ""];
  expect(validateInvitationDraft(birthday).error).toBeUndefined();
  birthday.invitation.occasion = "wedding";
  expect(validateInvitationDraft(birthday).error).toBeTruthy();
});

test("unsafe map URLs and arbitrary design values are rejected", () => {
  for (const mapUrl of ["javascript:alert(1)", "http://example.com", "https://user:pass@example.com"]) {
    const draft = makeDraft(); draft.invitation.functions[0].mapUrl = mapUrl;
    expect(validateInvitationDraft(draft).error).toBeTruthy();
  }
  const draft = makeDraft(); draft.invitation.functions[0].mapUrl = "https://maps.google.com/?q=Jaipur";
  expect(validateInvitationDraft(draft).error).toBeUndefined();
  expect(validateInvitationDraft({...draft, invitation:{...draft.invitation, design:{palette:"url(evil)"}}}).error).toBeTruthy();
});


test("unfinished hidden schedule items may remain drafts when the invitation is published", () => {
  const draft = makeDraft();
  Object.assign(draft.invitation.functions[0], {name:"",startsAt:"",venue:"",address:"",visibility:"hidden"});
  expect(validateInvitationDraft(draft).error).toBeUndefined();
  draft.invitation.functions[0].visibility = "public";
  expect(validateInvitationDraft(draft).error).toBeTruthy();
});


test("changing occasion preserves custom and deliberately removed wording", () => {
  const invitation = createOccasionInvitation();
  invitation.intro = ""; invitation.coverText = ""; invitation.message = "Our own words";
  invitation.design!.countdown = false;
  const birthday = applyOccasion(invitation, "birthday");
  expect(birthday.intro).toBe(""); expect(birthday.coverText).toBe("");
  expect(birthday.message).toBe("Our own words"); expect(birthday.design!.countdown).toBe(false);
});
