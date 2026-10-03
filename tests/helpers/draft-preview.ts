import { expect, type Page } from '@playwright/test';
import type { InvitationDraft } from '../../src/lib/invitation-draft';
import type { EventPhoto } from '../../src/types/media';

// Existing invitations remain renderable even when their occasion is not open
// for new creation. Use the same validated, same-origin message as the editor.
export async function showDraftPreview(page: Page, draft: InvitationDraft, photos: EventPhoto[] = []) {
  const payload = { type: 'invitly-preview', draft, photos };
  await expect.poll(async () => {
    await page.evaluate(data => window.postMessage(data, window.location.origin), payload);
    return page.locator(`#invitation[data-occasion="${draft.invitation.occasion || 'wedding'}"][data-theme="${draft.themeId}"]`).count();
  }).toBe(1);
  await expect(page.locator('.private-preview-notice')).toHaveCount(0);
}
