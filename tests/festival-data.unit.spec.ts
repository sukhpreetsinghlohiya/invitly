import { expect, test } from "@playwright/test";
import { applyFestivalPreset, festivalPresets, getFestivalPreset } from "../src/data/festivals";
import { applyOccasion, createOccasionInvitation } from "../src/data/occasions";
import { occasionDemo } from "../src/data/occasion-demos";
import { getOccasionThemes } from "../src/data/occasion-themes";
import { isOccasionAvailable } from "../src/data/occasion-availability";
import { validateInvitationDraft } from "../src/lib/invitation-draft";

test("festival creation is available, neutral and empty until the host adds their details", () => {
  const invitation = createOccasionInvitation("festival");
  expect(isOccasionAvailable("festival")).toBe(true);
  expect(getOccasionThemes("festival").map(theme => theme.id)).toEqual(["royal", "kesar", "mehfil"]);
  expect(invitation.festival).toEqual({ preset: "custom", title: "Festival gathering" });
  expect(invitation.couple).toEqual(["", ""]);
  expect(invitation.tradition).toBe("neutral");
  expect(invitation.weddingAt).toBe("");
  expect(invitation.functions).toEqual([]);
  expect(getFestivalPreset("unknown").id).toBe("custom");
});

test("festival presets replace only unchanged suggestions and never overwrite host details or plans", () => {
  const invitation = applyFestivalPreset(createOccasionInvitation("festival"), "diwali");
  expect(invitation.festival?.title).toBe("Diwali together");
  expect(invitation.coverText).toBe(getFestivalPreset("diwali").cover);
  invitation.festival!.title = "Our festive supper";
  invitation.intro = "ਸਿਮਰਨ ਦੇ ਘਰ ਜੀ ਆਇਆਂ ਨੂੰ";
  invitation.message = "Our own family plans.";
  invitation.coverText = "";
  invitation.tradition = "interfaith";
  invitation.couple = ["Simran & family", ""];
  invitation.weddingAt = "2027-01-12T18:00:00+05:30";
  invitation.functions = [{ id: "supper", name: "Supper with our neighbours", startsAt: invitation.weddingAt, description: "A host-written note", venue: "Our home", address: "Our address", dressCode: "Comfortable", icon: "sparkles" }];
  const next = applyFestivalPreset(invitation, "holi");
  expect(next).toEqual({ ...invitation, festival: { preset: "holi", title: "Our festive supper" } });
});

test("reapplying a festival query and switching occasions preserve the chosen preset and its suggestions", () => {
  const invitation = applyFestivalPreset(createOccasionInvitation("festival"), "eid");
  expect(applyOccasion(invitation, "festival")).toEqual(invitation);
  const wedding = applyOccasion(invitation, "wedding");
  expect(wedding.coverText).toBe(createOccasionInvitation("wedding").coverText);
  expect(applyOccasion(wedding, "festival")).toEqual(invitation);
});

test("every festival demo uses host identity without inventing official festival dates", () => {
  for (const preset of festivalPresets) {
    const demo = occasionDemo("festival", "royal", preset.id);
    expect(demo.festival?.preset).toBe(preset.id);
    expect(demo.couple).toEqual(["The Kapoor family", ""]);
    expect(demo.tradition).toBe("neutral");
    expect(demo.weddingAt).toBe("");
    expect(demo.functions.every(event => event.startsAt === "")).toBe(true);
    expect(validateInvitationDraft({ themeId: "royal", musicEnabled: false, invitation: demo }, "draft").error).toBeUndefined();
  }
});

test("festival metadata survives a saved draft and rejects unknown presets and overlong titles", () => {
  const invitation = applyFestivalPreset(createOccasionInvitation("festival"), "gurpurab");
  invitation.festival!.title = "ਸਾਡੇ ਪਰਿਵਾਰ ਦਾ ਸੱਦਾ";
  const draft = { themeId: "royal", musicEnabled: false, invitation };
  expect(validateInvitationDraft(draft, "draft").data?.invitation.festival).toEqual(invitation.festival);
  for (const festival of [{ preset: "not-a-festival", title: "Title" }, { preset: "custom", title: "x".repeat(101) }]) {
    expect(validateInvitationDraft({ ...draft, invitation: { ...invitation, festival } }, "draft").error).toBeTruthy();
  }
  const legacy = { ...draft, invitation: createOccasionInvitation("wedding") };
  expect(validateInvitationDraft(legacy, "draft").data?.invitation.festival).toBeUndefined();
});
