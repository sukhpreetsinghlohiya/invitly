import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayConfig } from "@/lib/razorpay";
import { getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { PACKS, CREDITS_PER_INVITATION, SIGNUP_CREDIT_GRANT, getUserCredits } from "@/lib/billing";
import { publicMetadata } from "@/lib/seo";
import "./pricing.css";

export const metadata = publicMetadata(
  "Credits & pricing — Invitly",
  "Simple credit packs for Indian celebrations. Pay only for the invitations you create.",
  "/pricing",
);
export const dynamic = "force-dynamic";

const PACK_ORDER = ["starter", "family", "studio", "atelier"] as const;

export default async function PricingPage() {
  let isAuthed = false;
  let balance = 0;
  if (getSupabaseConfig()) {
    try {
      const client = await createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        isAuthed = true;
        const credits = await getUserCredits(client, user.id).catch(() => null);
        balance = credits?.balance ?? 0;
      }
    } catch { /* fall through — show public pricing */ }
  }
  const billingReady = Boolean(getRazorpayConfig() && getSupabaseServiceConfig());

  return <>
    <header className="legal-header container pricing-header-nav">
      <Brand />
      <Link href="/">Back to home ↗</Link>
    </header>
    <main id="main" className="pricing-page container">
      <section className="pricing-header">
        <span className="eyebrow">INVITLY · CREDITS</span>
        <span className="pricing-handwritten">pay only for what you create,</span>
        <h1>Credits for every <em>celebration.</em></h1>
        <p>Buy credits once. Spend them whenever a wedding, sangeet, baby shower or birthday is on the way. {CREDITS_PER_INVITATION} credits = one beautiful Invitly invitation.</p>
        {isAuthed ? <p className="pricing-balance" aria-live="polite"><Sparkles size={14} aria-hidden="true" /> You have <strong>{balance.toLocaleString("en-IN")}</strong> credits — enough for {Math.floor(balance / CREDITS_PER_INVITATION)} invitation{Math.floor(balance / CREDITS_PER_INVITATION) === 1 ? "" : "s"}.</p> : <p className="pricing-balance"><Sparkles size={14} aria-hidden="true" /> New accounts start with <strong>{SIGNUP_CREDIT_GRANT} free credits</strong> — try Invitly before you pay.</p>}
      </section>

      <section className="pricing-grid pricing-grid-4" aria-label="Credit packs">
        {PACK_ORDER.map((packId) => {
          const pack = PACKS[packId];
          return <article key={pack.id} className={`pricing-card${pack.featured ? " is-featured" : ""}`}>
            {pack.featured ? <span className="pricing-badge">Most loved</span> : null}
            <h2>{pack.name}</h2>
            <p className="pricing-tagline">{pack.tagline}</p>
            <div className="pricing-price"><strong>{pack.priceLabel}</strong><span>one-time</span></div>
            <div className="pricing-credits"><strong>{pack.credits.toLocaleString("en-IN")}</strong> credits · {pack.perInviteLabel}</div>
            {pack.savingsLabel ? <span className="pricing-savings">{pack.savingsLabel}</span> : null}
            <ul>
              <li><Check size={18} aria-hidden="true" />{Math.floor(pack.credits / CREDITS_PER_INVITATION)} full invitations</li>
              <li><Check size={18} aria-hidden="true" />Every template & occasion</li>
              <li><Check size={18} aria-hidden="true" />Guest RSVPs, live updates, music</li>
              <li><Check size={18} aria-hidden="true" />Credits never expire</li>
            </ul>
            <UpgradeButton packId={pack.id} className="pricing-cta" isAuthed={isAuthed} billingReady={billingReady}>
              {isAuthed ? `Add ${pack.credits.toLocaleString("en-IN")} credits` : "Sign in to buy"}
            </UpgradeButton>
          </article>;
        })}
      </section>

      <p className="pricing-note">
        {billingReady
          ? <>Pay by UPI, card, netbanking or wallet. Secured by <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer">Razorpay</a>. GST invoice available on request.</>
          : <>Payments open shortly. Create invitations with your free credits in the meantime.</>}
      </p>

      <section className="pricing-faq" aria-label="Credit questions">
        <h2>Frequently asked</h2>
        <details><summary>How do credits work?</summary><p>Every new invitation uses {CREDITS_PER_INVITATION} credits. Credits never expire — buy once, spend whenever a celebration comes up.</p></details>
        <details><summary>Do my credits ever expire?</summary><p>No. Your credits stay in your account until you spend them.</p></details>
        <details><summary>What if I need just one invitation?</summary><p>Start with the ₹49 pack. You can always come back for more as new occasions arrive.</p></details>
        <details><summary>Can I get a refund?</summary><p>If something goes wrong within 7 days of purchase, write to us and we’ll make it right. Weddings are stressful enough.</p></details>
      </section>
    </main>
    <Footer />
  </>;
}
