"use client";

import Link from "next/link";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect, useRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { ArrowUpRight, ArrowRight, Search, Play, X } from "lucide-react";
import type { InvitationTheme, ThemeFamily } from "@/data/themes";
import { occasions, traditions } from "@/data/occasions";
import type { OccasionId, TraditionId } from "@/types/invitation";

const filters: ("All" | ThemeFamily)[] = ["All", "Indian", "Minimal", "Floral", "Contemporary"];

// Cover artwork arrives as server-rendered slots, keeping the drawing code out of this filter component.
export function ThemeGallery({ items, selectedOccasion, selectedTradition = "neutral" }: { selectedOccasion: OccasionId; selectedTradition?: TraditionId; items: { theme: InvitationTheme; artwork: ReactNode }[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(query), 180); return () => window.clearTimeout(timer); }, [query]);
  const occasion = selectedOccasion;
  const tradition = selectedTradition;
  const router = useRouter();
  const [changingOccasion, startTransition] = useTransition();
  const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matching = items.filter(({ theme }) => (!theme.occasions || theme.occasions.includes(occasion)) && (!theme.traditions || theme.traditions.includes(tradition)) && words.every(word => `${theme.name} ${theme.description} ${theme.family} ${theme.category} ${theme.keywords?.join(" ") || ""}`.toLocaleLowerCase().includes(word)));
  const visible = matching.filter(({ theme }) => activeFilter === "All" || theme.family === activeFilter);
  const clearSearch = () => { setQuery(""); searchInput.current?.focus(); };
  const resetFilters = () => { clearSearch(); setActiveFilter("All"); };
  const parameters = (themeId: string) => `theme=${themeId}&occasion=${occasion}&tradition=${tradition}`;
  const changeCollection = (nextOccasion: string, nextTradition: string) => startTransition(() => router.replace(`/templates?occasion=${nextOccasion}${nextTradition === "neutral" ? "" : `&tradition=${nextTradition}`}#collection`, { scroll: false }));
  const pendingLinkProps = { "aria-disabled": changingOccasion || undefined, tabIndex: changingOccasion ? -1 : undefined, onClick: (event: MouseEvent<HTMLAnchorElement>) => { if (changingOccasion) event.preventDefault(); } };

  return <div className="collection-gallery" aria-busy={changingOccasion || query !== search} data-gallery-occasion={occasion}>
    <div className="collection-search-controls"><div className="form-field collection-search-field"><label className="collection-search-label" htmlFor="collection-design-search">Find a design</label><span className="collection-search-input"><Search size={17} aria-hidden="true" /><input ref={searchInput} id="collection-design-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); clearSearch(); } }} placeholder="Try pink flowers, gold rings…" />{query && <button type="button" className="collection-clear-search" aria-label="Clear search" onClick={clearSearch}><X size={17} aria-hidden="true" /></button>}</span></div><label className="form-field">Occasion<select value={occasion} disabled={changingOccasion} onChange={event => changeCollection(event.target.value, tradition)}>{occasions.map(item => <option key={item.id} value={item.id} disabled={!isOccasionAvailable(item.id)}>{item.name}{!isOccasionAvailable(item.id) ? " · Coming soon" : ""}</option>)}</select></label><label className="form-field">Tradition (optional)<select value={tradition} disabled={changingOccasion} onChange={event => changeCollection(occasion, event.target.value)}>{traditions.map(item => <option key={item.id} value={item.id}>{item.id === "neutral" ? "No tradition" : item.name}</option>)}</select></label></div>
    {changingOccasion && <p className="collection-loading" role="status">Preparing your designs…</p>}
    <div className="collection-filter-bar"><div className="collection-filters" role="group" aria-label="Filter invitation styles">{filters.map(filter => <button type="button" key={filter} aria-label={filter} aria-pressed={activeFilter === filter} disabled={changingOccasion} onClick={() => setActiveFilter(filter)}>{filter}<span>{filter === "All" ? matching.length : matching.filter(({ theme }) => theme.family === filter).length}</span></button>)}</div><div className="collection-result-summary"><p className="collection-count" role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "invitation" : "invitations"}{search.trim() ? ` for “${search.trim()}”` : " to make your own"}{activeFilter !== "All" ? ` · ${activeFilter}` : ""}</p>{(query || activeFilter !== "All") && <button type="button" className="collection-reset" onClick={resetFilters}>Reset filters</button>}</div></div>
    {!visible.length && <div className="collection-empty"><h3>No matching designs yet.</h3><p>Try another name, colour or visual style.</p><button type="button" className="button button-secondary" onClick={resetFilters}>Clear search and style</button></div>}
    <div className="collection-grid">{visible.map(({ theme, artwork }) => <article className="collection-card" key={theme.id} style={{ "--collection-accent": theme.accent } as CSSProperties}>
      <Link className={`collection-card-preview preview-${theme.id}`} href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name} invitation`} prefetch={false} {...pendingLinkProps}>
        <span className="collection-card-art" aria-hidden="true">{artwork}</span>
        <span className="collection-card-preview-label"><Play size={12} aria-hidden="true" fill="currentColor" /> Live preview <ArrowUpRight size={14} aria-hidden="true" /></span>
      </Link>
      <div className="collection-card-copy"><div className="collection-card-tags"><span>{theme.number} <span aria-hidden="true">/</span> {theme.family}</span>{occasion === "wedding" && (theme.id === "royal" || theme.id === "mehfil") && <span>Opening doors</span>}</div><div className="collection-card-heading"><h3>{theme.name}</h3><span className="collection-swatch" aria-hidden="true" /></div><p className="collection-card-description">{theme.description}</p><div className="collection-card-actions"><Link href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name}`} prefetch={false} {...pendingLinkProps}><Play size={13} aria-hidden="true" /> Preview</Link><Link href={`/customize?${parameters(theme.id)}`} aria-label={`Customize ${theme.name}`} prefetch={false} {...pendingLinkProps}>Use design <ArrowRight size={15} aria-hidden="true" /></Link></div></div>
    </article>)}</div>
    <p className="collection-adapt-note">{items.length} complete {occasion === "wedding" ? "wedding" : "occasion-specific"} designs. Your names, photos, words, venue, and music stay with you when you switch. Choose a tradition to preview its symbol; you can hide it in the editor.</p>
  </div>;
}
