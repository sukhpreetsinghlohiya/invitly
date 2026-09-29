import type { Metadata } from "next";
import Link from "next/link";
import { Brand, Flower, Footer } from "@/components/brand";
import { InvitationArt } from "@/components/invitation-art";
import { demoInvitation } from "@/data/demo-invitation";
import { themes } from "@/data/themes";
import { ThemeGallery } from "./theme-gallery";
import "./gallery.css";

export const metadata: Metadata = {
  title: "The invitation collection",
  description: "Explore ten original Indian wedding invitation themes. Find your feeling, personalise the details, and share your celebration with Invitly.",
};

export default function TemplatesPage() {
  return <div className="collection-page">
    <header className="collection-header container"><Brand /><nav aria-label="Collection navigation"><Link href="/" className="collection-home-link">Back to home</Link><Link href="/customize" className="button button-small">Customize invitation <span aria-hidden="true">↗</span></Link></nav></header>
    <main id="main">
      <section className="collection-hero container" aria-labelledby="collection-title">
        <div className="collection-hero-copy"><span className="eyebrow"><Flower /> THE INVITLY COLLECTION</span><h1 id="collection-title">A feeling.<br />Before a <em>single word.</em></h1><p>The first glimpse of your celebration should feel like you. Find your invitation in ten thoughtfully made worlds, from palace gardens to a little modern magic.</p><a href="#collection" className="collection-browse-link">Find your invitation <span aria-hidden="true">↓</span></a><div className="collection-hero-note"><span className="collection-note-line" />Original artwork. Made for your people.</div></div>
        <div className="collection-hero-art" aria-hidden="true"><div className="collection-hero-orbit" /><span className="collection-hero-edition">THE WEDDING COLLECTION<br />NO. 001 — 010</span><div className="collection-hero-card collection-hero-card-back"><InvitationArt theme="pichwai" invitation={demoInvitation} compact /></div><div className="collection-hero-card collection-hero-card-front"><InvitationArt theme="royal" invitation={demoInvitation} compact /></div><Flower className="collection-hero-flower" /><span className="collection-hero-caption">For a celebration<br /><em>only you could have.</em></span></div>
      </section>
      <section className="collection-process" aria-label="From choosing a theme to sharing your invitation"><ol className="container"><li><span>01</span><div><strong>Choose a feeling</strong><p>Find the design that feels like you.</p></div></li><li><span>02</span><div><strong>Make it yours</strong><p>Add your names, moments, and places.</p></div></li><li><span>03</span><div><strong>Publish & share</strong><p>One little link for all your people.</p></div></li></ol></section>
      <section id="collection" className="collection-catalog container" aria-labelledby="collection-heading"><div className="collection-section-heading"><div><span className="eyebrow">TEN EXPRESSIONS OF TOGETHERNESS</span><h2 id="collection-heading">Which one feels <em>like you?</em></h2></div><p>Every style brings your story, celebrations, directions, and the little details together.</p></div>
        <ThemeGallery items={themes.map((theme) => ({ theme, artwork: <InvitationArt key={theme.id} theme={theme.id} invitation={demoInvitation} compact /> }))} />
      </section>
      <section className="collection-closing container"><Flower /><span className="eyebrow">THE DESIGN IS ONLY THE BEGINNING</span><h2>Your names.<br /><em>Your kind of forever.</em></h2><p>Try your details in the live editor. Switch styles until it feels just right.</p><Link href="/customize" className="button">Make an invitation <span aria-hidden="true">↗</span></Link></section>
    </main>
    <Footer />
  </div>;
}
