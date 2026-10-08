import { applyOccasion, getDesign } from "@/data/occasions";
import { applyFestivalPreset } from "@/data/festivals";
import type { FestivalPresetId, InvitationOpening, OccasionId, ThemeId, TraditionId } from "@/types/invitation";
import type { InvitationDraft } from "./invitation-draft";

export type DraftPreferences = { theme?: ThemeId; occasion?: OccasionId; tradition?: TraditionId; festival?: FestivalPresetId; opening?: InvitationOpening["style"] };

/** Apply choices carried from a demo without replacing a host's saved content. */
export function applyDraftPreferences(draft: InvitationDraft, choices: DraftPreferences): InvitationDraft {
  let invitation = choices.occasion ? applyOccasion(draft.invitation, choices.occasion) : draft.invitation;
  if (choices.tradition) invitation = { ...invitation, tradition: choices.tradition };
  if (choices.festival && invitation.occasion === "festival") invitation = applyFestivalPreset(invitation, choices.festival);
  if (choices.opening) {
    const design = getDesign(invitation);
    invitation = { ...invitation, design: { ...design, opening: { icon: "monogram", line: "An invitation, just for you", ...design.opening, style: choices.opening } } };
  }
  return { ...draft, themeId: choices.theme || draft.themeId, invitation };
}

/** Once saved, an old incoming choice must not override later edits on reload. */
export function savedDraftUrl(value: string) {
  const url = new URL(value);
  for (const key of ["theme", "occasion", "tradition", "festival", "opening"]) url.searchParams.delete(key);
  return `${url.pathname}${url.search}${url.hash}`;
}
