import { expect, test } from "@playwright/test";
import { applyDraftPreferences, savedDraftUrl } from "../src/lib/invitation-draft-preferences";
import { createOccasionInvitation } from "../src/data/occasions";
import { applyFestivalPreset } from "../src/data/festivals";
import type { InvitationDraft } from "../src/lib/invitation-draft";

test("explicit demo festival and opening choices survive restoration while preserving host content", () => {
  const invitation = applyFestivalPreset(createOccasionInvitation("festival"), "holi");
  invitation.couple = ["Simran & family", ""];
  invitation.festival!.title = "Our annual supper";
  invitation.message = "Our own words";
  invitation.design!.opening = { style: "envelope", icon: "flower", line: "Welcome to our home" };
  const draft: InvitationDraft = { themeId: "royal", musicEnabled: false, invitation };
  const chosen = applyDraftPreferences(draft, { occasion: "festival", theme: "kesar", festival: "diwali", opening: "flowers" });
  expect(chosen.themeId).toBe("kesar");
  expect(chosen.invitation.festival).toEqual({ preset: "diwali", title: "Our annual supper" });
  expect(chosen.invitation.couple).toEqual(invitation.couple);
  expect(chosen.invitation.message).toBe("Our own words");
  expect(chosen.invitation.functions).toEqual(invitation.functions);
  expect(chosen.invitation.design?.opening).toEqual({ style: "flowers", icon: "flower", line: "Welcome to our home" });
  expect(draft.invitation.festival?.preset).toBe("holi");
});

test("absent incoming choices preserve saved selections and saving consumes old design query choices", () => {
  const draft: InvitationDraft = { themeId: "mehfil", musicEnabled: false, invitation: applyFestivalPreset(createOccasionInvitation("festival"), "eid") };
  draft.invitation.design!.opening = { style: "doors", icon: "monogram", line: "A warm welcome" };
  expect(applyDraftPreferences(draft, {})).toEqual(draft);
  expect(savedDraftUrl("https://invitly.test/customize?occasion=festival&theme=royal&festival=diwali&opening=flowers&tradition=neutral&ref=collection#details")).toBe("/customize?ref=collection#details");
});
