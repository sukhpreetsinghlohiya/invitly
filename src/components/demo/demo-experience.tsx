"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Mail, RotateCcw } from "lucide-react";
import type { FestivalPresetId, InvitationMusic, InvitationOpening } from "@/types/invitation";
import { MusicControl } from "./music-control";
import styles from "./demo-experience.module.css";

export function DemoExperience({ children, theme, occasion, tradition, festival, designs, music, musicEnabled }: {
  children: React.ReactNode; theme: string; occasion: string; tradition: string;
  opening?: InvitationOpening["style"]; festival?: FestivalPresetId;
  designs: { id: string; name: string }[]; music?: InvitationMusic; musicEnabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shared = { occasion, tradition, opening: "envelope", ...(festival ? { festival } : {}) };
  const customize = `/customize?${new URLSearchParams({ theme, ...shared })}`;
  const replay = () => {
    document.dispatchEvent(new CustomEvent("invitly:replay-opening"));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return <div className={styles.experience} data-demo-theme={theme} aria-busy={isPending}>
    <header className={styles.toolbar}>
      <Link href={`/templates?${new URLSearchParams(shared)}#collection`} className={styles.back} aria-label="All designs"><ArrowLeft size={18} /><span>All designs</span></Link>
      <div className={styles.design}><label htmlFor="demo-design">LIVE DEMO</label><select id="demo-design" value={theme} disabled={isPending} onChange={event => {
        const nextTheme = event.target.value;
        startTransition(() => router.push(`/demo?${new URLSearchParams({ theme: nextTheme, ...shared })}`));
      }}>{!designs.some(design => design.id === theme) && <option value={theme}>Current design</option>}{designs.map(design => <option value={design.id} key={design.id}>{design.name}</option>)}</select></div>
      <Link href={customize} className={styles.create} aria-disabled={isPending || undefined} onClick={event => { if (isPending) event.preventDefault(); }}>Make it yours <ArrowUpRight size={15} /></Link>
    </header>
    <div className={styles.workspace}>
      <aside className={styles.tools} aria-label="Preview options">
        <span className={styles.envelopeLabel}><Mail size={17} aria-hidden="true" /> Envelope</span>
        <button type="button" className={styles.replay} aria-label="Replay envelope opening" disabled={isPending} onClick={replay}><RotateCcw size={15} /><span>Replay opening</span></button>
        {musicEnabled && <div className={styles.music}><MusicControl key={`${occasion}:${theme}`} music={music} autoPlay /></div>}
      </aside>
      <div className={styles.preview}>
        <div className={styles.note} role="status"><span className={styles.previewDot} aria-hidden="true" /><span>{isPending ? "Opening your next design…" : "Sample invitation · Tap to explore"}</span></div>
        {children}
      </div>
    </div>
  </div>;
}
