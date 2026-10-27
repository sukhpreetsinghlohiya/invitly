import Link from "next/link";
import { Infinity as InfinityIcon, LockKeyhole, Sparkles } from "lucide-react";
import { FREE_INVITATION_LIMIT, INVITATION_LIMIT_MESSAGE } from "@/lib/invitation-plan";
import "./invitation-plan.css";

export function InvitationAllowanceBanner({ used, unlimited = false }: { used: number; unlimited?: boolean }) {
  if (unlimited) {
    return <aside className="invitation-allowance is-pro" aria-label="Pro plan">
      <div>
        <span className="invitation-plan-label">INVITLY · PRO</span>
        <strong><InfinityIcon size={18} aria-hidden="true" /> Unlimited invitations</strong>
        <p>Thank you for upgrading. Create as many invitations as you need — every template, every occasion.</p>
      </div>
      <Link className="button button-secondary" href="/dashboard/plan"><Sparkles size={16} /> Your plan</Link>
    </aside>;
  }
  const reached = used >= FREE_INVITATION_LIMIT;
  return <aside className="invitation-allowance" aria-label="Free invitation allowance">
    <div><span className="invitation-plan-label">YOUR FREE PLAN</span><strong>{Math.min(used, FREE_INVITATION_LIMIT)} of {FREE_INVITATION_LIMIT} free invitations used</strong><p>{reached ? "You’ve used your free invitations. Upgrade to Pro for unlimited invitations for a year." : "Choose any template. Each new invitation saved to your account uses one free slot. Editing it is always included."}</p></div>
    <Link className="button button-secondary" href={reached ? "/pricing" : "/dashboard/plan"}><Sparkles size={16} /> {reached ? "Upgrade to Pro" : "View your plan"}</Link>
  </aside>;
}

export function InvitationLimitNotice() {
  return <section className="invitation-limit" aria-label="Invitation limit reached">
    <LockKeyhole size={26} aria-hidden="true" />
    <h2>You’ve used your free invitations.</h2>
    <p>{INVITATION_LIMIT_MESSAGE}</p>
    <Link href="/pricing" className="button">Upgrade to Pro — ₹999 / year</Link>
    <small>Pay once by UPI, card or netbanking. No subscription.</small>
    <Link className="text-link" href="/dashboard">Back to your invitations</Link>
  </section>;
}
