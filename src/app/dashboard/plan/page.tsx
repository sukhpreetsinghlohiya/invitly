import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { InvitationLimitNotice } from "@/components/invitation-plan-notice";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getInvitationAllowance } from "@/lib/invitation-allowance";
import { FREE_INVITATION_LIMIT } from "@/lib/invitation-plan";

export const metadata = { title: "Your plan", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  if (!getSupabaseConfig()) redirect("/setup");
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const allowance = await getInvitationAllowance(client, user.id);
  return <><main id="main" className="utility-page container invitation-plan-page"><Brand /><section className="utility-card">
    <p className="eyebrow">YOUR INVITLY PLAN</p><h1>{allowance.limitReached ? "More celebrations, coming soon." : "Your first two invitations are on us."}</h1>
    <p><strong>{Math.min(allowance.used, FREE_INVITATION_LIMIT)} of {FREE_INVITATION_LIMIT} free invitations used</strong></p>
    {allowance.limitReached ? <InvitationLimitNotice /> : <><p>Try any template with your two free invitations. You can edit, publish and share them at no extra cost.</p><p>Need more? Paid plans and payments are coming soon.</p><button type="button" className="button button-secondary" disabled>Payments coming soon</button><p><Link className="button" href="/customize">Create an invitation</Link></p><Link className="text-link" href="/dashboard">Back to your invitations</Link></>}
    <p>Free slots are used when you first save an invitation to your account. Deleting or unpublishing it does not restore a slot.</p>
  </section></main><Footer /></>;
}
