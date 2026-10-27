import Link from "next/link";
import { Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayConfig } from "@/lib/razorpay";
import { getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/billing";
import { publicMetadata } from "@/lib/seo";
import "./pricing.css";

export const metadata = publicMetadata(
  "Pricing — Invitly",
  "Simple pricing for Indian celebrations. Start free, upgrade when the whole family needs an invitation.",
  "/pricing",
);
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  let isAuthed = false;
  if (getSupabaseConfig()) {
    try {
      const client = await createClient();
      const { data: { user } } = await client.auth.getUser();
      isAuthed = Boolean(user);
    } catch {
      isAuthed = false;
    }
  }
  const billingReady = Boolean(getRazorpayConfig() && getSupabaseServiceConfig());
  const free = PLANS.free;
  const pro = PLANS.pro;

  return <>
    <header className="legal-header container pricing-header-nav">
      <Brand />
      <Link href="/">Back to home ↗</Link>
    </header>
    <main id="main" className="pricing-page container">
      <section className="pricing-header">
        <span className="eyebrow">INVITLY · PRICING</span>
        <span className="pricing-handwritten">one small price,</span>
        <h1>Beautiful invitations, <em>for every celebration.</em></h1>
        <p>Start free with two invitations on us. When your family needs more — a wedding, a sangeet, a reception — upgrade in one tap.</p>
      </section>

      <section className="pricing-grid" aria-label="Invitly plans">
        <article className="pricing-card">
          <h2>{free.name}</h2>
          <p className="pricing-tagline">{free.tagline}</p>
          <div className="pricing-price"><strong>{free.priceLabel}</strong><span>forever</span></div>
          <ul>{free.highlights.map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul>
          <Link className="button button-secondary" href={isAuthed ? "/customize" : "/signup"}>{isAuthed ? "Create an invitation" : "Start free"}</Link>
        </article>

        <article className="pricing-card is-featured">
          <span className="pricing-badge">Most loved</span>
          <h2>{pro.name}</h2>
          <p className="pricing-tagline">{pro.tagline}</p>
          <div className="pricing-price"><strong>{pro.priceLabel}</strong><span>one-time · 1 year</span></div>
          <ul>{pro.highlights.map((item) => <li key={item}><Check size={18} aria-hidden="true" />{item}</li>)}</ul>
          <UpgradeButton planId="pro" className="pricing-cta" isAuthed={isAuthed} billingReady={billingReady}>
            {isAuthed ? pro.cta : "Sign in to upgrade"}
          </UpgradeButton>
        </article>
      </section>

      <p className="pricing-note">
        {billingReady
          ? <>Pay by UPI, card, netbanking or wallet. Secured by <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer">Razorpay</a>. GST invoice available on request.</>
          : <>Payments open shortly. Create your invitations free in the meantime — you’ll be the first to upgrade when we go live.</>}
      </p>

      <section className="pricing-faq" aria-label="Pricing questions">
        <h2>Frequently asked</h2>
        <details><summary>Is this really a one-time payment?</summary><p>Yes. ₹999 covers one full year of unlimited invitations, with no auto-renewal and no card on file. Renew only if you want to.</p></details>
        <details><summary>What happens to my existing invitations if I don’t upgrade?</summary><p>They stay yours. You can keep editing, publishing and sharing the two invitations on the free plan — forever.</p></details>
        <details><summary>Can I get a refund?</summary><p>If something goes wrong within 7 days of upgrading, write to us and we’ll make it right. Weddings are stressful enough.</p></details>
        <details><summary>Will you add RSVP analytics and more templates?</summary><p>Yes — Pro accounts get everything new first. We ship weekly.</p></details>
      </section>
    </main>
    <Footer />
  </>;
}
