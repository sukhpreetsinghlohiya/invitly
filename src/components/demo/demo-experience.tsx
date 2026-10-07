"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { InvitationMusic } from "@/types/invitation";
import { MusicControl } from "./music-control";
import styles from "./demo-experience.module.css";

export function DemoExperience({ children, theme, occasion, tradition, designs, music, musicEnabled }: {
  children: React.ReactNode; theme: string; occasion: string; tradition: string;
  designs: { id: string; name: string }[]; music?: InvitationMusic; musicEnabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const customize = `/customize?${new URLSearchParams({ theme, occasion, tradition })}`;
  return <div className={styles.experience} data-demo-theme={theme} aria-busy={isPending}>
    <header className={styles.toolbar}>
      <Link href={`/templates?occasion=${occasion}#collection`} className={styles.back} aria-label="All designs"><ArrowLeft size={18} /><span>All designs</span></Link>
      <div className={styles.design}><label htmlFor="demo-design">YOU’RE PREVIEWING</label><select id="demo-design" value={theme} disabled={isPending} onChange={event => {
        const nextTheme = event.target.value;
        startTransition(() => router.push(`/demo?${new URLSearchParams({ theme: nextTheme, occasion, tradition })}`));
      }}>{!designs.some(design => design.id === theme) && <option value={theme}>Current design</option>}{designs.map(design => <option value={design.id} key={design.id}>{design.name}</option>)}</select></div>
      <Link href={customize} className={styles.create} aria-disabled={isPending || undefined} onClick={event => { if (isPending) event.preventDefault(); }}>Make it yours <ArrowUpRight size={15} /></Link>
    </header>
    <div className={styles.note} role="status"><span className={styles.previewDot} aria-hidden="true" /><span>{isPending ? "Opening your next design…" : "Sample invitation · Add your names, photos & details"}</span></div>
    {children}
    {musicEnabled && <div className={styles.music}><MusicControl key={`${occasion}:${theme}`} music={music} autoPlay /></div>}
  </div>;
}
