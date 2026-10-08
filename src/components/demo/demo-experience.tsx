"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import { openingStyles } from "@/data/invitation-openings";
import { OpeningScene } from "@/components/opening-scene";
import type { FestivalPresetId, InvitationMusic, InvitationOpening } from "@/types/invitation";
import { MusicControl } from "./music-control";
import styles from "./demo-experience.module.css";

export function DemoExperience({ children, theme, occasion, tradition, opening, festival, designs, music, musicEnabled }: {
  children: React.ReactNode; theme: string; occasion: string; tradition: string;
  opening?: InvitationOpening["style"]; festival?: FestivalPresetId;
  designs: { id: string; name: string }[]; music?: InvitationMusic; musicEnabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shared = { occasion, tradition, ...(opening ? { opening } : {}), ...(festival ? { festival } : {}) };
  const customize = `/customize?${new URLSearchParams({ theme, ...shared })}`;
  const changeOpening = (style: string) => startTransition(() => router.push(`/demo?${new URLSearchParams({ theme, ...shared, opening: style })}`));
  const replay = () => {
    document.dispatchEvent(new CustomEvent("invitly:replay-opening"));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return <div className={styles.experience} data-demo-theme={theme} aria-busy={isPending}>
    <header className={styles.toolbar}>
      <Link href={`/templates?${new URLSearchParams(shared)}#collection`} className={styles.back} aria-label="All designs"><ArrowLeft size={18} /><span>All designs</span></Link>
      <div className={styles.design}><label htmlFor="demo-design">YOU’RE PREVIEWING</label><select id="demo-design" value={theme} disabled={isPending} onChange={event => {
        const nextTheme = event.target.value;
        startTransition(() => router.push(`/demo?${new URLSearchParams({ theme: nextTheme, ...shared })}`));
      }}>{!designs.some(design => design.id === theme) && <option value={theme}>Current design</option>}{designs.map(design => <option value={design.id} key={design.id}>{design.name}</option>)}</select></div>
      <Link href={customize} className={styles.create} aria-disabled={isPending || undefined} onClick={event => { if (isPending) event.preventDefault(); }}>Make it yours <ArrowUpRight size={15} /></Link>
    </header>
    <div className={styles.workspace}>
      <aside className={styles.tools} aria-label="Preview options">
        <div className={styles.toolsHeading}><h2>A little first impression</h2><p>Choose how your invitation opens.</p></div>
        <div className={styles.mobileOpening}><label htmlFor="demo-opening">Opening</label><select id="demo-opening" value={opening || "theme"} disabled={isPending} onChange={event => changeOpening(event.target.value)}>{openingStyles.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div className={styles.openings}>{openingStyles.filter(item => item.id !== "theme" && item.id !== "none").map(item => <button key={item.id} type="button" className={styles.openingChoice} aria-pressed={opening === item.id} disabled={isPending} onClick={() => changeOpening(item.id)}><span className={styles.thumbnail}><OpeningScene style={item.id} compact /></span><span>{item.label}</span></button>)}</div>
        <div className={styles.plainChoices}>{openingStyles.slice(0, 2).map(item => <button type="button" key={item.id} aria-pressed={(opening || "theme") === item.id} disabled={isPending} onClick={() => changeOpening(item.id)}>{item.label}</button>)}</div>
        {opening !== "none" && <button type="button" className={styles.replay} disabled={isPending} onClick={replay}><RotateCcw size={15} /><span>Replay opening</span></button>}
        <p className={styles.hint}>Your names. Your photos. Your favourite song.</p>
        {musicEnabled && <div className={styles.music}><MusicControl key={`${occasion}:${theme}`} music={music} autoPlay /></div>}
      </aside>
      <div className={styles.preview}>
        <div className={styles.note} role="status"><span className={styles.previewDot} aria-hidden="true" /><span>{isPending ? "Opening your next design…" : "Sample invitation · Tap to explore"}</span></div>
        {children}
      </div>
    </div>
  </div>;
}
