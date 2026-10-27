import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { CREDITS_PER_INVITATION } from "@/lib/billing";
import { INVITATION_LIMIT_MESSAGE } from "@/lib/invitation-plan";
import "./invitation-plan.css";

export function InvitationAllowanceBanner({ balance, invitationsAvailable }: { balance: number; invitationsAvailable: number }) {
  const empty = balance < CREDITS_PER_INVITATION;
  return <aside className="invitation-allowance" aria-label="Your credits">
    <div>
      <span className="invitation-plan-label">INVITLY · CREDITS</span>
      <strong>{balance.toLocaleString("en-IN")} credits · {invitationsAvailable} invitation{invitationsAvailable === 1 ? "" : "s"} ready</strong>
      <p>{empty ? "You’ve used your credits. Add more to create your next invitation — existing invitations stay editable." : `Each new invitation uses ${CREDITS_PER_INVITATION} credits. Credits never expire.`}</p>
    </div>
    <Link className="button button-secondary" href={empty ? "/pricing" : "/dashboard/plan"}><Sparkles size={16} /> {empty ? "Add credits" : "Your credits"}</Link>
  </aside>;
}

export function InvitationLimitNotice() {
  return <section className="invitation-limit" aria-label="Invitation limit reached">
    <LockKeyhole size={26} aria-hidden="true" />
    <h2>You’ve used your credits.</h2>
    <p>{INVITATION_LIMIT_MESSAGE}</p>
    <Link href="/pricing" className="button">Add credits</Link>
    <small>Packs start at ₹49 for 100 credits (one invitation).</small>
    <Link className="text-link" href="/dashboard">Back to your invitations</Link>
  </section>;
}
