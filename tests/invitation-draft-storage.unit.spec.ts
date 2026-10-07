import { expect, test } from "@playwright/test";
import { demoInvitation } from "../src/data/demo-invitation";
import { type InvitationDraft } from "../src/lib/invitation-draft";
import { accountDraftBackup, readAccountDraftBackup } from "../src/lib/invitation-draft-storage";

const eventId = "11111111-1111-4111-a111-111111111111";
const saved = (): InvitationDraft => ({ themeId: "royal", musicEnabled: false, invitation: structuredClone(demoInvitation) });

test("failed account saves can recover changes without overwriting the saved version", () => {
  const account = saved();
  const edited = saved();
  edited.invitation.couple[0] = "Recovered Simran";
  const backup = accountDraftBackup(edited, eventId);
  expect(readAccountDraftBackup(backup, eventId, account)?.invitation.couple[0]).toBe("Recovered Simran");
  expect(account.invitation.couple[0]).toBe(demoInvitation.couple[0]);
  // A committed save cannot appear as a conflicting recovery after a reload.
  expect(readAccountDraftBackup(backup, eventId, edited)).toBeNull();
});

test("invalid and other-event backups cannot replace invitation contents", () => {
  const edited = saved();
  edited.invitation.couple[0] = "Local changes";
  const backup = accountDraftBackup(edited, eventId);
  expect(readAccountDraftBackup(backup, "22222222-2222-4222-a222-222222222222", saved())).toBeNull();
  for (const raw of [null, "invalid", "null", "[]", JSON.stringify(edited), JSON.stringify({ version: 1, eventId, draft: { ...edited, themeId: "invalid" } })]) {
    expect(readAccountDraftBackup(raw, eventId, saved())).toBeNull();
  }
});
