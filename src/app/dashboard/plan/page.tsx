import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { InvitationLimitNotice } from "@/components/invitation-plan-notice";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getInvitationAllowance } from "@/lib/invitation-allowance";
import { FREE_INVITATION_LIMIT } from "@/lib/invitation-plan";
import { PLANS } from "@/lib/billing";

export const metadata = { title: "Your plan", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ welcome?: string }> };

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}

export default async function PlanPage({ searchParams }: Props) {
  if (!getSupabaseConfig()) redirect("/setup");
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { welcome } = await searchParams;
  const allowance = await getInvitationAllowance(client, user.id);
  const pro = PLANS.pro;
  const expiresLabel = formatExpiry(allowance.plan.expiresAt);
  const justUpgraded = welcome === "pro" && allowance.unlimited;

  return <>
    <main id="main" className="utility-page container invitation-plan-page">
      <Brand />
      <section className="utility-card">
        <p className="eyebrow">YOUR INVITLY PLAN</p>

        {allowance.unlimited ? <>
          <h1>{justUpgraded ? "Welcome to Pro." : "You’re on Invitly Pro."}</h1>
          <p><strong>Unlimited invitations</strong>{expiresLabel ? <> · active until {expiresLabel}</> : null}</p>
          <p>Thank you — your upgrade helps us keep building beautiful invitations for Indian families. Create as many invitations as you need.</p>
          <ul className="plan-highlights">
            {pro.highlights.map((item) => <li key={item}><Check size={16} aria-hidden="true" /> {item}</li>)}
          </ul>
          <p><Link className="button" href="/customize">Create an invitation</Link></p>
          <Link className="text-link" href="/dashboard">Back to your invitations</Link>
        </> : allowance.limitReached ? <>
          <h1>Ready for more celebrations?</h1>
          <p><strong>{Math.min(allowance.used, FREE_INVITATION_LIMIT)} of {FREE_INVITATION_LIMIT} free invitations used</strong></p>
          <InvitationLimitNotice />
        </> : <>
          <h1>Your first two invitations are on us.</h1>
          <p><strong>{Math.min(allowance.used, FREE_INVITATION_LIMIT)} of {FREE_INVITATION_LIMIT} free invitations used</strong></p>
          <p>Try any template with your free invitations. You can edit, publish and share them at no extra cost.</p>
          <p>Planning a wedding or hosting multiple functions? Upgrade to Pro for unlimited invitations for a year.</p>
          <p><Link className="button" href="/pricing"><Sparkles size={16} aria-hidden="true" /> See Pro — {pro.priceLabel}</Link></p>
          <p><Link className="button button-secondary" href="/customize">Create an invitation</Link></p>
          <Link className="text-link" href="/dashboard">Back to your invitations</Link>
        </>}

        <p className="plan-footnote">Free slots are used when you first save an invitation to your account. Deleting or unpublishing it does not restore a slot.</p>
      </section>
    </main>
    <Footer />
  </>;
}
