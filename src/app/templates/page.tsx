import { publicMetadata } from "@/lib/seo";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon, ComingSoonBadge } from "@/components/occasion-coming-soon";
import type { Metadata } from "next";
import Link from "next/link";
import { Brand, Flower } from "@/components/brand";
import { Footer } from "@/components/footer";
import { InvitationArt } from "@/components/invitation-art";
import { IllustratedCover } from "@/components/wedding/illustrated-cover";
import { occasionDemo, occasionCollections } from "@/data/occasion-demos";
import { getOccasion, occasions, traditions } from "@/data/occasions";
import { OccasionCardArt } from "@/components/occasion-card-art";
import { getOccasionThemes } from "@/data/occasion-themes";
import type { ThemeId } from "@/types/invitation";
import { ThemeGallery } from "./theme-gallery";
import "./gallery.css";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ occasion?: string }> }): Promise<Metadata> {
  const { occasion: selection } = await searchParams;
  const occasion = getOccasion(selection);
  const available = isOccasionAvailable(occasion.id);
  const canonical = occasion.id === "wedding" ? "/templates" : `/templates?occasion=${occasion.id}`;
  return { ...publicMetadata(`${occasion.name} invitation designs`, available ? `Explore original ${occasion.name.toLowerCase()} invitations with rich artwork, editable details, photographs and music.` : `${occasion.name} invitations are coming soon. Explore our wedding and engagement collections.`, canonical), ...(!available ? { robots: { index: false, follow: true } } : {}) };
}

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ occasion?: string; tradition?: string }> }) {
  const params = await searchParams;
  const occasion = getOccasion(params.occasion);
  if (!isOccasionAvailable(occasion.id)) return <OccasionComingSoon occasion={occasion.id} />;
  const tradition = traditions.find(item => item.id === params.tradition)?.id || "neutral";
  const traditionQuery = tradition === "neutral" ? "" : `&tradition=${tradition}`;
  const demoInvitation = { ...occasionDemo(occasion.id), tradition };
  const collectionThemes = getOccasionThemes(occasion.id);
  const customizeUrl = `/customize?occasion=${occasion.id}&theme=${collectionThemes[0].id}${traditionQuery}`;
  const artwork = (theme: ThemeId) => occasion.id === "wedding"
    ? <IllustratedCover invitation={{ ...occasionDemo(occasion.id, theme), tradition }} theme={theme} compact />
    : <InvitationArt invitation={demoInvitation} theme={theme} compact />;

  return <div className="collection-page">
    <header className="collection-header container"><Brand /><nav aria-label="Collection navigation"><Link href="/" className="collection-home-link">Back to home</Link><Link href={customizeUrl} className="button button-small">Customize invitation <span aria-hidden="true">↗</span></Link></nav></header>
    <main id="main">
      <section className="collection-hero container" aria-labelledby="collection-title">
        <div className="collection-hero-copy"><span className="eyebrow"><Flower /> THE INVITLY COLLECTION</span><h1 id="collection-title">Find your kind<br className="collection-title-break" /> of <em>beautiful.</em></h1><p>Choose a design you love. Make it yours with your names, photographs, music and every little detail.</p><div className="collection-hero-links"><a href="#collection" className="collection-browse-link">Browse {collectionThemes.length} {occasion.name.toLowerCase()} designs <span aria-hidden="true">↓</span></a><a href="#occasion-collections-title" className="collection-occasion-link">Explore the occasions <span aria-hidden="true">↗</span></a></div><div className="collection-hero-note"><span className="collection-note-line" />Your first 2 invitations are free.</div></div>
        <div className="collection-hero-art" aria-hidden="true"><div className="collection-hero-orbit" /><span className="collection-hero-edition">{occasion.name.toUpperCase()}<br />THE INVITLY EDIT</span><div className="collection-hero-card collection-hero-card-back">{artwork(collectionThemes[1].id)}</div><div className="collection-hero-card collection-hero-card-front">{artwork(collectionThemes[0].id)}</div><Flower className="collection-hero-flower" /><span className="collection-hero-caption">A little tradition.<br /><em>A little you.</em></span></div>
      </section>
      <section id="collection" className="collection-catalog container" aria-labelledby="collection-heading"><div className="collection-section-heading"><div><span className="eyebrow">MADE FOR YOUR MOMENT</span><h2 id="collection-heading">{occasion.name === "Other gathering" ? "Your gathering" : occasion.name} <em>invitations</em></h2></div><p>Every design includes photos, music & RSVPs.<br />Open a preview to see the whole invitation.</p></div>
        <ThemeGallery key={occasion.id} selectedOccasion={occasion.id} selectedTradition={tradition} items={collectionThemes.map(theme => ({ theme, artwork: artwork(theme.id) }))} />
      </section>
      <section className="occasion-collections container" aria-labelledby="occasion-collections-title"><div><span className="eyebrow">EVERY KIND OF TOGETHERNESS</span><h2 id="occasion-collections-title">An invitation for <em>your moment.</em></h2><p>Wedding and engagement collections are ready. More occasions are coming soon.</p></div><div className="occasion-collection-grid">{occasions.map(item => {
        const collection = occasionCollections[item.id];
        const available = isOccasionAvailable(item.id);
        const content = <><OccasionCardArt occasion={item.id} /><div className="occasion-collection-copy"><span>{item.name}</span><strong>{collection.title}</strong><p>{collection.description}</p>{available ? <span className="occasion-collection-action">Explore {getOccasionThemes(item.id).length} designs <span aria-hidden="true">↗</span></span> : <ComingSoonBadge />}</div></>;
        return available ? <Link key={item.id} href={`/templates?occasion=${item.id}${traditionQuery}#collection`} aria-current={occasion.id === item.id ? "page" : undefined} className={`occasion-collection occasion-collection-${item.id}`} prefetch={false}>{content}</Link> : <article key={item.id} className={`occasion-collection occasion-collection-${item.id}`} data-coming-soon={item.id}>{content}</article>;
      })}</div></section>
      <section className="collection-process" aria-label="From choosing a theme to sharing your invitation"><ol className="container"><li><span>01</span><div><strong>Find your design</strong><p>Preview the real invitation.</p></div></li><li><span>02</span><div><strong>Tell your story</strong><p>Add your names, words, and moments.</p></div></li><li><span>03</span><div><strong>Bring everyone together</strong><p>Publish a link for your people.</p></div></li></ol></section>
      <section className="collection-closing container"><Flower /><span className="eyebrow">THE DESIGN IS ONLY THE BEGINNING</span><h2>Your names.<br /><em>Your kind of together.</em></h2><p>Try your details in the live editor. Switch styles until it feels just right.</p><Link href={customizeUrl} className="button">Make an invitation <span aria-hidden="true">↗</span></Link></section>
    </main>
    <Footer />
  </div>;
}
