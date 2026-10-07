import { validateInvitationDraft, type InvitationDraft } from "./invitation-draft";

export const INVITATION_DRAFT_STORAGE_KEY = "invitly:invitation-draft:v2";

/** Account backups only represent a save that has not been acknowledged yet. */
export function accountDraftBackup(draft: InvitationDraft, eventId: string) {
  return JSON.stringify({ version: 1, eventId, draft });
}

export function readAccountDraftBackup(raw: string | null, eventId: string, savedDraft: InvitationDraft): InvitationDraft | null {
  if (!raw) return null;
  try {
    const backup: unknown = JSON.parse(raw);
    if (!backup || typeof backup !== "object" || !("version" in backup) || backup.version !== 1 || !("eventId" in backup) || backup.eventId !== eventId || !("draft" in backup)) return null;
    const checked = validateInvitationDraft(backup.draft, "draft");
    const saved = validateInvitationDraft(savedDraft, "draft");
    if (!checked.data || JSON.stringify(checked.data) === JSON.stringify(saved.data)) return null;
    return checked.data;
  } catch { return null; }
}
