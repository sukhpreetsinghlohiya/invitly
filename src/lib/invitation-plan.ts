export const FREE_INVITATION_LIMIT = 2;
export const INVITATION_LIMIT_MESSAGE = "You’ve used your 2 free invitations. Upgrade to Pro to create unlimited invitations for a year. Your existing invitations remain editable.";
export const ALLOWANCE_UNAVAILABLE_MESSAGE = "We couldn’t check your invitation allowance. Please refresh and try again.";

export function isInvitationLimitError(error: { code?: string; message?: string } | null) {
  return error?.code === "P0001" && error.message === "FREE_INVITATION_LIMIT_REACHED";
}
