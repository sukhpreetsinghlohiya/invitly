"use client";

import Link from "next/link";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, ArrowRight, Search, Play } from "lucide-react";
import type { InvitationTheme, ThemeFamily } from "@/data/themes";
import { getOccasion, occasions, traditions } from "@/data/occasions";
import type { OccasionId, TraditionId } from "@/types/invitation";

const filters: ("All" | ThemeFamily)[] = ["All", "Indian", "Minimal", "Floral", "Contemporary"];

// Cover artwork arrives as server-rendered slots, keeping the drawing code out of this filter component.
export function ThemeGallery({ items, selectedOccasion, selectedTradition = "neutral" }: { selectedOccasion: OccasionId; selectedTradition?: TraditionId; items: { theme: InvitationTheme; artwork: ReactNode }[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setSearch(query), 180); return () => window.clearTimeout(timer); }, [query]);
  const occasion = selectedOccasion;
  const tradition = selectedTradition;
  const router = useRouter();
  const [changingOccasion, startTransition] = useTransition();
  const visible = items.filter(({ theme }) => (activeFilter === "All" || theme.family === activeFilter) && (!theme.occasions || theme.occasions.includes(occasion)) && (!theme.traditions || theme.traditions.includes(tradition)) && `${theme.name} ${theme.description} ${theme.family} ${theme.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  const parameters = (themeId: string) => `theme=${themeId}&occasion=${occasion}&tradition=${tradition}`;
  const changeCollection = (nextOccasion: string, nextTradition: string) => startTransition(() => router.replace(`/templates?occasion=${nextOccasion}${nextTradition === "neutral" ? "" : `&tradition=${nextTradition}`}#collection`, { scroll: false }));
  const occasionLabel = getOccasion(occasion).name;

  return <div className="collection-gallery" aria-busy={changingOccasion || query !== search} data-gallery-occasion={occasion}>
    <div className="collection-search-controls"><label className="form-field collection-search-field">Find a design<span className="collection-search-input"><Search size={17} aria-hidden="true" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search names, flowers, minimal…" /></span></label><label className="form-field">Occasion<select value={occasion} onChange={event => changeCollection(event.target.value, tradition)}>{occasions.map(item => <option key={item.id} value={item.id} disabled={!isOccasionAvailable(item.id)}>{item.name}{!isOccasionAvailable(item.id) ? " · Coming soon" : ""}</option>)}</select></label><label className="form-field">Tradition (optional)<select value={tradition} onChange={event => changeCollection(occasion, event.target.value)}>{traditions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    {changingOccasion && <p className="collection-loading" role="status">Preparing your designs…</p>}
    <div className="collection-filter-bar"><div className="collection-filters" role="group" aria-label="Filter invitation styles">{filters.map(filter => <button type="button" key={filter} aria-label={filter} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{filter}<span>{filter === "All" ? items.length : items.filter(({ theme }) => theme.family === filter).length}</span></button>)}</div><p className="collection-count" role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "invitation" : "invitations"}{activeFilter !== "All" ? ` · ${activeFilter}` : " to make your own"}</p></div>
    {!visible.length && <div className="collection-empty"><h3>No matching designs yet.</h3><p>Try another name or visual style.</p><button type="button" className="button button-secondary" onClick={() => { setQuery(""); setActiveFilter("All"); }}>Clear search and style</button></div>}
    <div className="collection-grid">{visible.map(({ theme, artwork }) => <article className="collection-card" key={theme.id} style={{ "--collection-accent": theme.accent } as CSSProperties}>
      <Link className={`collection-card-preview preview-${theme.id}`} href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name} invitation`} prefetch={false}>
        <span className="collection-card-art" aria-hidden="true">{artwork}</span>
        <span className="collection-card-preview-label"><Play size={12} aria-hidden="true" fill="currentColor" /> Live preview <ArrowUpRight size={14} aria-hidden="true" /></span>
      </Link>
      <div className="collection-card-copy"><div className="collection-card-tags"><span>{occasionLabel}</span><span>{occasion === "wedding" && (theme.id === "royal" || theme.id === "mehfil") ? "Doors open" : "Illustrated design"}</span></div><div className="collection-card-heading"><h3>{theme.name}</h3><span className="collection-swatch" aria-hidden="true" /></div><p className="collection-card-category">{theme.category}</p><p className="collection-card-description">{theme.description}</p><div className="collection-card-actions"><Link href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name}`} prefetch={false}>Preview <ArrowUpRight size={14} aria-hidden="true" /></Link><Link href={`/customize?${parameters(theme.id)}`} aria-label={`Customize ${theme.name}`} prefetch={false}>Use design <ArrowRight size={14} aria-hidden="true" /></Link></div></div>
    </article>)}</div>
    <p className="collection-adapt-note">{items.length} complete {occasion === "wedding" ? "wedding" : "occasion-specific"} designs. Your names, photos, words, venue, and music stay with you when you switch. Traditions are optional; no religious symbols are added automatically.</p>
  </div>;
}
