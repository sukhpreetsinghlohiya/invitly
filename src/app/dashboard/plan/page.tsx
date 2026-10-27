import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { CREDITS_PER_INVITATION, getRecentCreditTransactions, getUserCredits } from "@/lib/billing";

export const metadata = { title: "Your credits", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ welcome?: string; added?: string }> };

function reasonLabel(reason: string) {
  switch (reason) {
    case "signup_grant": return "Welcome credits";
    case "purchase": return "Credits added";
    case "invitation_spend": return "Invitation created";
    case "refund": return "Refund";
    case "adjustment": return "Adjustment";
    default: return reason;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

export default async function PlanPage({ searchParams }: Props) {
  if (!getSupabaseConfig()) redirect("/setup");
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { welcome, added } = await searchParams;
  const [credits, transactions] = await Promise.all([
    getUserCredits(client, user.id),
    getRecentCreditTransactions(client, user.id, 10),
  ]);
  const invitations = Math.floor(credits.balance / CREDITS_PER_INVITATION);
  const justAdded = welcome === "credits" && typeof added === "string" && /^\d+$/.test(added);

  return <>
    <main id="main" className="utility-page container invitation-plan-page">
      <Brand />
      <section className="utility-card">
        <p className="eyebrow">YOUR INVITLY CREDITS</p>

        {justAdded ? <h1>{Number(added).toLocaleString("en-IN")} credits added. ✨</h1>
          : credits.balance === 0 ? <h1>Add credits to create your next invitation.</h1>
          : <h1>You have {credits.balance.toLocaleString("en-IN")} credits.</h1>}

        <div className="credit-balance-card" aria-live="polite">
          <div><span className="credit-label">Current balance</span><strong>{credits.balance.toLocaleString("en-IN")} credits</strong></div>
          <div><span className="credit-label">Invitations available</span><strong>{invitations}</strong></div>
          <div><span className="credit-label">Lifetime purchased</span><strong>{credits.lifetimePurchased.toLocaleString("en-IN")}</strong></div>
        </div>

        <p className="plan-footnote">Each new invitation uses {CREDITS_PER_INVITATION} credits. Credits never expire.</p>

        <div className="credit-actions">
          <Link className="button" href="/pricing"><Sparkles size={16} aria-hidden="true" /> Add credits</Link>
          {credits.balance >= CREDITS_PER_INVITATION ? <Link className="button button-secondary" href="/customize">Create an invitation</Link> : null}
        </div>

        {transactions.length ? <>
          <h2 className="credit-ledger-heading">Recent activity</h2>
          <ul className="credit-ledger">
            {transactions.map((tx) => <li key={tx.id}>
              <div><strong>{reasonLabel(tx.reason)}</strong><span>{tx.note ?? ""}</span></div>
              <div className="credit-ledger-right">
                <span className={tx.delta > 0 ? "credit-delta-positive" : "credit-delta-negative"}>{tx.delta > 0 ? "+" : ""}{tx.delta.toLocaleString("en-IN")}</span>
                <time dateTime={tx.createdAt}>{formatDate(tx.createdAt)}</time>
              </div>
            </li>)}
          </ul>
        </> : null}

        <Link className="text-link" href="/dashboard">Back to your invitations</Link>
      </section>
    </main>
    <Footer />
  </>;
}
