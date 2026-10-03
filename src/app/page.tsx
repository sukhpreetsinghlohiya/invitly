import { MarketingHeader } from "@/components/navigation/marketing-header";
import { publicMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Flower } from "@/components/brand";
import { Footer } from "@/components/footer";
import { InvitationArt } from "@/components/invitation-art";
import { SetupNotice } from "@/components/setup-notice";
import { demoInvitation } from "@/data/demo-invitation";
import { themes } from "@/data/themes";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CelebrationCompanion } from "@/components/marketing/celebration-companion";
import { HomeHero } from "@/components/marketing/home-hero";
import { OccasionMarquee } from "@/components/marketing/occasion-marquee";
import { OccasionShowcase } from "@/components/marketing/occasion-showcase";
import { FrequentlyAskedQuestions } from "@/components/marketing/faq";
import "@/components/marketing/marketing.css";

export const metadata = { ...publicMetadata("Invitly — A little link. A lot of togetherness.", "Thoughtful wedding and engagement invitations. Choose a design, tell your story, share personal guest links, and collect RSVPs.", "/"), title: { absolute: "Invitly — A little link. A lot of togetherness." } };

export default function Home() {
  return <div className="stationery-home">
    <SetupNotice />
    <MarketingHeader />
    <main id="main">
      <HomeHero />
      <OccasionMarquee />
      <OccasionShowcase />
      <section id="themes" className="section container"><div className="section-heading"><div><span className="eyebrow">THE INVITLY COLLECTION</span><h2>Your story. <em>Your kind of beautiful.</em></h2></div><p>Ten wedding designs and three engagement designs are ready to make your own. More occasions are coming soon.</p></div><div className="theme-grid">{themes.slice(0, 3).map((theme) => <Link href={`/demo?theme=${theme.id}`} key={theme.id} className="theme-card"><div className={`theme-preview preview-${theme.id}`}><span className="theme-number">N° {theme.number}</span><InvitationArt theme={theme.id} invitation={demoInvitation} compact /><span className="preview-open" aria-hidden="true"><ArrowUpRight size={20} /></span></div><div className="theme-title"><h3>{theme.name}</h3><span>{theme.category}</span></div><p>{theme.description}</p><span className="theme-link">Explore invitation <ArrowRight size={15} /></span></Link>)}</div><div className="homepage-collection-link"><Link className="button button-secondary" href="/templates">Explore the collections <ArrowRight size={16} /></Link></div></section>
      <HowItWorks />
      <CelebrationCompanion />
      <FrequentlyAskedQuestions />
      <section className="closing-cta container"><Flower /><span className="eyebrow">LET’S MAKE SOMETHING MEMORABLE</span><h2>Your people.<br /><em>One beautiful invitation.</em></h2><Link className="button button-light" href="/demo">Step inside the demo <ArrowUpRight size={18} /></Link><p>No sign-up needed. Just a little curiosity.</p><Link className="closing-account" href="/customize">Create your own invitation <ArrowRight size={14} /></Link></section>
    </main><Footer />
  </div>;
}
