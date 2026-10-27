export const INVITATION_LIMIT_MESSAGE = "You’ve run out of invitation credits. Add credits to create your next invitation. Your existing invitations stay editable.";
export const ALLOWANCE_UNAVAILABLE_MESSAGE = "We couldn’t check your credit balance. Please refresh and try again.";

export function isInvitationLimitError(error: { code?: string; message?: string } | null) {
  return error?.code === "P0001" && error.message === "FREE_INVITATION_LIMIT_REACHED";
}
