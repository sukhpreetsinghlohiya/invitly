import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { FREE_INVITATION_LIMIT, INVITATION_LIMIT_MESSAGE } from "@/lib/invitation-plan";
import "./invitation-plan.css";

export function InvitationAllowanceBanner({ used }: { used: number }) {
  const reached = used >= FREE_INVITATION_LIMIT;
  return <aside className="invitation-allowance" aria-label="Free invitation allowance">
    <div><span className="invitation-plan-label">YOUR FREE PLAN</span><strong>{Math.min(used, FREE_INVITATION_LIMIT)} of {FREE_INVITATION_LIMIT} free invitations used</strong><p>{reached ? "More invitations require a paid plan. Payments are coming soon. Your existing invitations stay available." : "Choose any template. Each new invitation saved to your account uses one free slot. Editing it is always included."}</p></div>
    <Link className="button button-secondary" href="/dashboard/plan"><Sparkles size={16} /> {reached ? "Upgrade · Coming soon" : "View your plan"}</Link>
  </aside>;
}

export function InvitationLimitNotice() {
  return <section className="invitation-limit" aria-label="Invitation limit reached">
    <LockKeyhole size={26} aria-hidden="true" />
    <h2>You’ve used your free invitations.</h2>
    <p>{INVITATION_LIMIT_MESSAGE}</p>
    <button type="button" className="button" disabled>Payments coming soon</button>
    <small>No payment can be made yet.</small>
    <Link className="text-link" href="/dashboard">Back to your invitations</Link>
  </section>;
}
