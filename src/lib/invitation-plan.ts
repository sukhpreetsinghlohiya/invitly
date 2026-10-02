export const FREE_INVITATION_LIMIT = 2;
export const INVITATION_LIMIT_MESSAGE = "You’ve used your 2 free invitations. Additional invitations require a paid plan. Payments are coming soon. You can still edit and share your existing invitations.";
export const ALLOWANCE_UNAVAILABLE_MESSAGE = "We couldn’t check your free invitation allowance. Please refresh and try again.";

export function isInvitationLimitError(error: { code?: string; message?: string } | null) {
  return error?.code === "P0001" && error.message === "FREE_INVITATION_LIMIT_REACHED";
}
