"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Play, Star } from "lucide-react";
import { cinematicThemes } from "@/data/cinematic-themes";
import { occasionDemo } from "@/data/occasion-demos";
import { CinematicCover } from "@/components/wedding/cinematic-cover";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import styles from "./cinematic-home.module.css";

/* ─── Hero ─── */
export function CinematicHomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="home-h1">
      <Image
        src="/images/demo/couple-portrait.webp"
        alt="Wedding couple"
        fill sizes="100vw" priority
        className={styles.heroBg}
      />
      <div className={styles.heroGrad} />
      <div className={styles.heroContent}>
        <p className={styles.heroEye}>India's most personal digital invitation</p>
        <h1 id="home-h1" className={styles.heroH1}>
          The invitation<br />
          <em>they'll never forget.</em>
        </h1>
        <p className={styles.heroSub}>
          Add your names, photos, music and story.<br />
          Share one link. Watch the replies pour in.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/demo?theme=meenaya" className={styles.btnGold}>
            <Play size={14} strokeWidth={2.5} />
            See a live invitation
          </Link>
          <Link href="/templates" className={styles.btnGhost}>
            Browse designs <ArrowUpRight size={15} />
          </Link>
        </div>
        <ul className={styles.heroTrust}>
          <li><Check size={11} strokeWidth={3} /> Free to start</li>
          <li><Check size={11} strokeWidth={3} /> No design skills needed</li>
          <li><Check size={11} strokeWidth={3} /> Share in minutes</li>
        </ul>
      </div>
    </section>
  );
}

/* ─── Occasion Strip ─── */
const occasions = [
  ["💍","Wedding"],["💫","Engagement"],["🎂","Birthday"],["🌸","Baby Shower"],
  ["✨","Festival"],["❤️","Anniversary"],["🏡","Housewarming"],["🎤","Conference"],
  ["🌿","Naming"],["🥂","Girls Night"],["💻","Webinar"],["🕯️","Remembrance"],
  ["🎈","Kids Party"],["🌐","Virtual Meet"],["🌺","Gathering"],
];

export function OccasionStrip() {
  return (
    <div className={styles.strip}>
      <div className={styles.stripTrack}>
        {[...occasions, ...occasions].map(([icon, label], i) => (
          <span key={i} className={styles.stripItem}>
            <span aria-hidden="true">{icon}</span>{label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Template Showcase ─── */
export function CinematicCollection() {
  return (
    <section className={styles.showcase} aria-labelledby="showcase-h2">
      <div className={styles.showcaseHead} data-reveal>
        <span className={styles.tag}>THE COLLECTION</span>
        <h2 id="showcase-h2" className={styles.sectionH2}>
          Designs that feel <em>like you.</em>
        </h2>
        <p className={styles.sectionSub}>
          Six cinematic wedding designs. 15 occasion types.<br />
          Every invitation includes photos, music and personal RSVPs.
        </p>
      </div>
      <div className={styles.showcaseGrid}>
        {cinematicThemes.map((theme, i) => (
          <article key={theme.id} className={styles.showcaseCard} data-reveal>
            <Link href={`/demo?theme=${theme.id}`} className={styles.cardThumb} aria-label={`Preview ${theme.name}`}>
              <CinematicCover invitation={occasionDemo("wedding", theme.id)} theme={theme.id} compact />
              <div className={styles.cardOverlay}><span>Live preview →</span></div>
            </Link>
            <div className={styles.cardInfo}>
              <span className={styles.cardEye}>{theme.category}</span>
              <h3 className={styles.cardName}>{theme.name}</h3>
              <div className={styles.cardActions}>
                <Link href={`/demo?theme=${theme.id}`} className={styles.cardPreviewLink}>Preview</Link>
                <Link href={`/customize?theme=${theme.id}&occasion=wedding`} className={styles.cardUseLink}>
                  Use this <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className={styles.showcaseFooter}>
        <Link href="/templates" className={styles.btnDark}>
          See all templates <ArrowRight size={15} />
        </Link>
        <p>Weddings · Birthdays · Festivals · Conferences · and more</p>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
export function SimpleSteps() {
  return (
    <section className={styles.how} aria-labelledby="how-h2">
      <div className={styles.howInner}>
        <div className={styles.howHead} data-reveal>
          <span className={styles.tag}>HOW IT WORKS</span>
          <h2 id="how-h2" className={styles.sectionH2}>Up and running<br /><em>in minutes.</em></h2>
        </div>
        <div className={styles.howGrid}>
          {[
            { n:"01", emoji:"🎨", h:"Pick your design", p:"Choose from 15 occasion types. Preview every detail live — weddings, birthdays, festivals and more." },
            { n:"02", emoji:"✏️", h:"Make it personal", p:"Your names, photos, story, venues and dates. Every change reflects instantly in your preview." },
            { n:"03", emoji:"💌", h:"Share with love", p:"Send your link on WhatsApp. Each guest gets a personal RSVP. See replies in your dashboard." },
          ].map(s => (
            <div key={s.n} className={styles.howCard} data-reveal>
              <div className={styles.howTop}>
                <span className={styles.howEmoji}>{s.emoji}</span>
                <span className={styles.howNum}>{s.n}</span>
              </div>
              <h3 className={styles.howTitle}>{s.h}</h3>
              <p className={styles.howBody}>{s.p}</p>
            </div>
          ))}
        </div>
        <Link href="/templates" className={styles.btnDark} data-reveal>
          Create your invitation free <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

/* ─── Features ─── */
const feats = [
  { e:"📸", h:"Your photos", p:"Couple and family photos woven beautifully across every page." },
  { e:"🎵", h:"Background music", p:"A song that means something, playing as guests open the invite." },
  { e:"📍", h:"Venues & directions", p:"Clear address and a tap-to-open Google Maps link for every event." },
  { e:"✅", h:"Personal RSVPs", p:"One unique link per guest. Track every reply from your dashboard." },
  { e:"💌", h:"15 occasion types", p:"Weddings, birthdays, festivals, conferences, and more — all covered." },
  { e:"📖", h:"Your love story", p:"Tell your story in your own words. Every invitation feels one-of-a-kind." },
];

export function FeatureHighlights() {
  return (
    <section className={styles.feats} aria-labelledby="feats-h2">
      <div className={styles.featsInner}>
        <div className={styles.featsHead} data-reveal>
          <span className={styles.tag}>EVERYTHING INCLUDED</span>
          <h2 id="feats-h2" className={styles.sectionH2}>Everything you need,<br /><em>nothing you don't.</em></h2>
        </div>
        <div className={styles.featsGrid}>
          {feats.map(f => (
            <div key={f.h} className={styles.featCard} data-reveal>
              <span className={styles.featEmoji}>{f.e}</span>
              <h3 className={styles.featTitle}>{f.h}</h3>
              <p className={styles.featBody}>{f.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
const testi = [
  { i:"P", name:"Priya S.", loc:"Mumbai", q:"My mum cried when she opened it. The music and photos made it feel like a real experience, not just a message.", s:5 },
  { i:"A", name:"Aditya K.", loc:"Delhi", q:"Under an hour to set up. Guests loved their personal link — no downloads, no confusion. Everyone replied instantly.", s:5 },
  { i:"R", name:"Rina & Dev", loc:"Bangalore", q:"So many guests asked how we made it. More personal than anything printed could ever be.", s:5 },
];

export function WeddingReactions() {
  return (
    <section className={styles.proof} aria-labelledby="proof-h2">
      <div className={styles.proofInner}>
        <div className={styles.proofHead} data-reveal>
          <span className={styles.tag} style={{ color:"rgba(255,255,255,.45)" }}>WHAT PEOPLE SAY</span>
          <h2 id="proof-h2" className={styles.sectionH2} style={{ color:"#fff" }}>
            An invite worth <em style={{ color:"#e8c98a" }}>sharing again.</em>
          </h2>
        </div>
        <div className={styles.proofGrid}>
          {testi.map(t => (
            <div key={t.name} className={styles.proofCard} data-reveal>
              <div className={styles.proofStars}>{Array(t.s).fill("★").join("")}</div>
              <p className={styles.proofQ}>"{t.q}"</p>
              <div className={styles.proofAuthor}>
                <span className={styles.proofAvatar}>{t.i}</span>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.loc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.proofNote}>Illustrative examples, not verified customer reviews.</p>
      </div>
    </section>
  );
}

export function FullControl() { return null; }
