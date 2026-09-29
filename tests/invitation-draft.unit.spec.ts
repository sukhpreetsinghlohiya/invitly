import { expect, test } from "@playwright/test";
import { demoInvitation } from "../src/data/demo-invitation";
import { themes } from "../src/data/themes";
import { isValidInvitationDate, validateInvitationDraft, type InvitationDraft } from "../src/lib/invitation-draft";

const makeDraft = (): InvitationDraft => ({ themeId: "royal", invitation: structuredClone(demoInvitation), musicEnabled: false });

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
  expect(validateInvitationDraft(empty).error).toBeTruthy();
  const tooMany = makeDraft();
  tooMany.invitation.functions = Array.from({ length: 13 }, (_, index) => ({ ...demoInvitation.functions[0], id: `function-${index}` }));
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
