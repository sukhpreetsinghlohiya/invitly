import { publicMetadata } from "@/lib/seo";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon } from "@/components/occasion-coming-soon";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { InvitationArt } from "@/components/invitation-art";
import { IllustratedCover } from "@/components/wedding/illustrated-cover";
import { occasionDemo, occasionCollections } from "@/data/occasion-demos";
import { getOccasion, occasions, traditions } from "@/data/occasions";
import { festivalPresets, getFestivalPreset } from "@/data/festivals";
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
  return { ...publicMetadata(`${occasion.name} invitation designs`, available ? `Explore original ${occasion.name.toLowerCase()} invitations with rich artwork, editable details, photographs and music.` : `${occasion.name} invitations are coming soon. Explore our wedding, engagement and festival collections.`, canonical), ...(!available ? { robots: { index: false, follow: true } } : {}) };
}

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ occasion?: string; tradition?: string; festival?: string }> }) {
  const params = await searchParams;
  const occasion = getOccasion(params.occasion);
  if (!isOccasionAvailable(occasion.id)) return <OccasionComingSoon occasion={occasion.id} />;
  const tradition = traditions.find(item => item.id === params.tradition)?.id || "neutral";
  const festival = occasion.id === "festival" ? getFestivalPreset(params.festival).id : undefined;
  const traditionQuery = tradition === "neutral" ? "" : `&tradition=${tradition}`;
  const festivalQuery = festival ? `&festival=${festival}` : "";
  const collectionThemes = getOccasionThemes(occasion.id);
  const customizeUrl = `/customize?occasion=${occasion.id}&theme=${collectionThemes[0].id}${traditionQuery}${festivalQuery}`;
  const artwork = (theme: ThemeId) => {
    const invitation = { ...occasionDemo(occasion.id, theme, festival), tradition };
    return occasion.id === "wedding" ? <IllustratedCover invitation={invitation} theme={theme} compact /> : <InvitationArt invitation={invitation} theme={theme} compact />;
  };
  const available = occasions.filter(item => isOccasionAvailable(item.id));
  return <div className="collection-page">
    <header className="collection-header container"><Brand /><nav aria-label="Collection navigation"><Link href="/" className="collection-home-link">Home</Link><Link href="/templates" aria-current="page" className="collection-home-link">Templates</Link><Link href={customizeUrl} className="button button-small">Create invitation <ArrowRight size={15} aria-hidden="true" /></Link></nav></header>
    <main id="main">
      <section className="collection-intro container" aria-labelledby="collection-title"><nav className="collection-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span>Invitation templates</span></nav><div className="collection-intro-heading"><div><span className="eyebrow">A LITTLE TRADITION. A LITTLE YOU.</span><h1 id="collection-title">Find a design.<br className="collection-mobile-break" /> <em>Make it yours.</em></h1><p>Beautiful invitations for your people. Pick a template, add your details, and bring everyone together.</p></div><span className="collection-free-note"><Check size={17} aria-hidden="true" /> First 2 invitations free</span></div><nav className="collection-occasion-tabs" aria-label="Invitation collections">{available.map(item => <Link key={item.id} href={`/templates?occasion=${item.id}${traditionQuery}`} prefetch={false} aria-current={occasion.id === item.id ? "page" : undefined}>{item.name}<span>{getOccasionThemes(item.id).length}</span></Link>)}</nav></section>
      <section id="collection" className="collection-catalog container" aria-labelledby="collection-heading"><div className="collection-section-heading"><h2 id="collection-heading">{occasion.name} invitation templates</h2><span>Made to be personal</span></div>
        {occasion.id === "festival" && <nav className="collection-festival-presets" aria-label="Festival collections">{festivalPresets.map(preset => <Link key={preset.id} href={`/templates?occasion=festival&festival=${preset.id}${traditionQuery}#collection`} aria-current={festival === preset.id ? "page" : undefined} prefetch={false}>{preset.name}</Link>)}</nav>}
        <ThemeGallery key={`${occasion.id}:${festival || ""}`} selectedOccasion={occasion.id} selectedTradition={tradition} selectedFestival={festival} items={collectionThemes.map(theme => ({ theme, artwork: artwork(theme.id) }))} />
      </section>
      <section className="occasion-collections container" aria-labelledby="occasion-collections-title"><div className="collection-section-heading"><h2 id="occasion-collections-title">More moments to celebrate</h2><span>Find your next invitation</span></div><div className="occasion-collection-grid">{available.map(item => {
        const collection = occasionCollections[item.id];
        return <Link key={item.id} href={`/templates?occasion=${item.id}${traditionQuery}#collection`} aria-current={occasion.id === item.id ? "page" : undefined} className={`occasion-collection occasion-collection-${item.id}`} prefetch={false}><OccasionCardArt occasion={item.id} /><div className="occasion-collection-copy"><span>{item.name}</span><strong>{collection.title}</strong><p>{collection.description}</p><span className="occasion-collection-action">Explore designs <ArrowRight size={15} aria-hidden="true" /></span></div></Link>;
      })}</div><p className="collection-coming-note">Birthday, baby shower, housewarming and more collections are coming soon.</p></section>
      <section className="collection-process" aria-label="From choosing a theme to sharing your invitation"><ol className="container"><li><span>01</span><div><strong>Find your design</strong><p>Choose the card that feels like you.</p></div></li><li><span>02</span><div><strong>Make it personal</strong><p>Add details, photos and an opening.</p></div></li><li><span>03</span><div><strong>Invite your people</strong><p>Share one beautiful invitation link.</p></div></li></ol></section>
    </main><Footer />
  </div>;
}
