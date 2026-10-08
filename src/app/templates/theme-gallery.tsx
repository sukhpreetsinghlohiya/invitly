"use client";

import Link from "next/link";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect, useRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { ArrowUpRight, ArrowRight, Search, Play, X, Heart, ChevronLeft, ChevronRight, ImagePlus, Music2, PencilLine, Check } from "lucide-react";
import type { InvitationTheme, ThemeFamily } from "@/data/themes";
import { occasions, traditions } from "@/data/occasions";
import type { FestivalPresetId, OccasionId, TraditionId } from "@/types/invitation";
import { ArtworkStage } from "@/components/artwork-stage";
import { useFavourites } from "./use-favourites";

const filters: ("All" | ThemeFamily)[] = ["All", "Indian", "Minimal", "Floral", "Contemporary"];
type GalleryItem = { theme: InvitationTheme; artwork: ReactNode };

// Artwork remains server-rendered. Opening a closer look moves its slot into the dialog.
export function ThemeGallery({ items, selectedOccasion, selectedTradition = "neutral", selectedFestival }: { selectedFestival?: FestivalPresetId; selectedOccasion: OccasionId; selectedTradition?: TraditionId; items: GalleryItem[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { saved, toggle } = useFavourites();
  const searchInput = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(query), 180); return () => window.clearTimeout(timer); }, [query]);
  const occasion = selectedOccasion;
  const tradition = selectedTradition;
  const router = useRouter();
  const [changingOccasion, startTransition] = useTransition();
  const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const eligible = items.filter(({ theme }) => (!theme.occasions || theme.occasions.includes(occasion)) && (!theme.traditions || theme.traditions.includes(tradition)));
  const matching = eligible.filter(({ theme }) => (!favouritesOnly || saved.includes(`${occasion}:${theme.id}`)) && words.every(word => `${theme.name} ${theme.description} ${theme.family} ${theme.category} ${theme.keywords?.join(" ") || ""}`.toLocaleLowerCase().includes(word)));
  const visible = matching.filter(({ theme }) => activeFilter === "All" || theme.family === activeFilter);
  const preview = items.find(item => item.theme.id === previewId);
  const previewIndex = visible.findIndex(item => item.theme.id === previewId);
  const savedCount = eligible.filter(item => saved.includes(`${occasion}:${item.theme.id}`)).length;
  const clearSearch = () => { setQuery(""); searchInput.current?.focus(); };
  const resetFilters = () => { clearSearch(); setActiveFilter("All"); setFavouritesOnly(false); };
  const parameters = (themeId: string) => `theme=${themeId}&occasion=${occasion}&tradition=${tradition}${selectedFestival ? `&festival=${selectedFestival}` : ""}`;
  const changeCollection = (nextOccasion: string, nextTradition: string) => startTransition(() => router.replace(`/templates?occasion=${nextOccasion}${nextTradition === "neutral" ? "" : `&tradition=${nextTradition}`}${nextOccasion === "festival" && selectedFestival ? `&festival=${selectedFestival}` : ""}#collection`, { scroll: false }));
  const pendingLinkProps = { "aria-disabled": changingOccasion || undefined, tabIndex: changingOccasion ? -1 : undefined, onClick: (event: MouseEvent<HTMLAnchorElement>) => { if (changingOccasion) event.preventDefault(); } };
  function showPreview(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (changingOccasion) { event.preventDefault(); return; }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener.current = event.currentTarget;
    setPreviewId(id);
  }
  function saveFavourite(theme: InvitationTheme) {
    const wasSaved = saved.includes(`${occasion}:${theme.id}`);
    const persistent = toggle(`${occasion}:${theme.id}`);
    setSavedMessage(`${theme.name} ${wasSaved ? "removed from favourites." : persistent ? "saved to favourites on this device." : "saved for this visit. Your browser is not allowing storage."}`);
  }
  const previewOpen = Boolean(preview);
  useEffect(() => {
    if (!previewOpen) return;
    const element = dialog.current;
    if (!element) return;
    const fallbackFocus = searchInput.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.setProperty("overflow", "hidden");
    element.showModal();
    closeButton.current?.focus();
    return () => {
      element.close();
      document.body.style.setProperty("overflow", previousOverflow);
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
      else fallbackFocus?.focus({ preventScroll: true });
    };
  }, [previewOpen]);

  return <div className="collection-gallery" aria-busy={changingOccasion || query !== search} data-gallery-occasion={occasion}>
    <div className="collection-search-controls"><div className="form-field collection-search-field"><label className="collection-search-label" htmlFor="collection-design-search">Find a design</label><span className="collection-search-input"><Search size={20} aria-hidden="true" /><input ref={searchInput} id="collection-design-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); clearSearch(); } }} placeholder="Try pink flowers, gold rings…" />{query && <button type="button" className="collection-clear-search" aria-label="Clear search" onClick={clearSearch}><X size={18} aria-hidden="true" /></button>}</span></div><label className="form-field">Occasion<select value={occasion} disabled={changingOccasion} onChange={event => changeCollection(event.target.value, tradition)}>{occasions.map(item => <option key={item.id} value={item.id} disabled={!isOccasionAvailable(item.id)}>{item.name}{!isOccasionAvailable(item.id) ? " · Coming soon" : ""}</option>)}</select></label><label className="form-field">Tradition (optional)<select value={tradition} disabled={changingOccasion} onChange={event => changeCollection(occasion, event.target.value)}>{traditions.map(item => <option key={item.id} value={item.id}>{item.id === "neutral" ? "No tradition" : item.name}</option>)}</select></label></div>
    <div className="collection-filter-bar"><div className="collection-filters" role="group" aria-label="Filter invitation styles">{filters.map(filter => <button type="button" key={filter} aria-label={filter} aria-pressed={activeFilter === filter} disabled={changingOccasion} onClick={() => setActiveFilter(filter)}>{filter === "All" ? "All" : filter}<span>{filter === "All" ? matching.length : matching.filter(({ theme }) => theme.family === filter).length}</span></button>)}</div><button type="button" className="collection-favourites-filter" aria-pressed={favouritesOnly} onClick={() => setFavouritesOnly(!favouritesOnly)} disabled={changingOccasion}><Heart size={16} fill={favouritesOnly ? "currentColor" : "none"} aria-hidden="true" /> Favourites <span>{savedCount}</span></button></div>
    <div className="collection-result-summary"><p className="collection-count" role="status" aria-live="polite">{changingOccasion ? "Preparing your designs…" : `${visible.length} ${visible.length === 1 ? "invitation" : "invitations"}${search.trim() ? ` for “${search.trim()}”` : favouritesOnly ? " in your favourites" : " to make your own"}${activeFilter !== "All" ? ` · ${activeFilter}` : ""}`}</p>{(query || activeFilter !== "All" || favouritesOnly) ? <button type="button" className="collection-reset" onClick={resetFilters}>Reset filters</button> : <span className="collection-result-hint">Choose a card for a closer look</span>}</div>
    <p className="collection-saved-message" role="status" aria-live="polite">{savedMessage}</p>
    {!visible.length && <div className="collection-empty">{favouritesOnly ? <Heart size={28} aria-hidden="true" /> : <Search size={28} aria-hidden="true" />}<h3>{favouritesOnly && !savedCount ? "Keep the ones you love." : "No matching designs yet."}</h3><p>{favouritesOnly && !savedCount ? "Tap the heart on a design to save it here. Favourites stay on this device." : "Try another name, colour or visual style."}</p><button type="button" className="button button-secondary" onClick={resetFilters}>{favouritesOnly && !savedCount ? "Explore designs" : "Clear search and style"}</button></div>}
    <div className="collection-grid">{visible.map(({ theme, artwork }) => {
      const isSaved = saved.includes(`${occasion}:${theme.id}`);
      return <article className="collection-card" key={theme.id} style={{ "--collection-accent": theme.accent } as CSSProperties}>
        <div className={`collection-card-stage preview-${theme.id}`}>
          <Link className="collection-card-preview" href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name} invitation`} aria-haspopup="dialog" prefetch={false} {...pendingLinkProps} onClick={event => showPreview(event, theme.id)}><ArtworkStage>{previewId === theme.id ? <div className="collection-preview-placeholder" /> : <span className="collection-card-art" aria-hidden="true">{artwork}</span>}</ArtworkStage><span className="collection-card-preview-label"><Search size={14} aria-hidden="true" /> Closer look</span></Link>
          <button className="collection-save" type="button" aria-label={`${isSaved ? "Remove" : "Save"} ${theme.name} ${isSaved ? "from" : "to"} favourites`} aria-pressed={isSaved} disabled={changingOccasion} onClick={() => saveFavourite(theme)}><Heart size={18} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" /></button>
        </div>
        <div className="collection-card-copy"><div className="collection-card-heading"><h3>{theme.name}</h3><span className="collection-swatch" aria-hidden="true" /></div><p className="collection-card-category">{theme.family} <span aria-hidden="true">·</span> {occasion === "wedding" ? "Wedding" : occasions.find(item => item.id === occasion)?.name}</p><div className="collection-card-actions"><Link href={`/demo?${parameters(theme.id)}`} aria-label={`Preview ${theme.name}`} aria-haspopup="dialog" prefetch={false} {...pendingLinkProps} onClick={event => showPreview(event, theme.id)}>Preview</Link><Link href={`/customize?${parameters(theme.id)}`} aria-label={`Customize ${theme.name}`} prefetch={false} {...pendingLinkProps}>Use design <ArrowRight size={14} aria-hidden="true" /></Link></div></div>
      </article>;
    })}</div>
    <p className="collection-adapt-note"><Check size={15} aria-hidden="true" /> Every design includes photos, music and RSVPs. Your details stay with you when you switch styles.</p>
    {preview && <dialog ref={dialog} className="collection-detail" aria-labelledby="design-preview-title" onCancel={event => { event.preventDefault(); setPreviewId(null); }} onClick={event => { if (event.target === event.currentTarget) setPreviewId(null); }}>
      <div className="collection-detail-layout"><button ref={closeButton} type="button" className="collection-detail-close" aria-label="Close design preview" onClick={() => setPreviewId(null)}><X size={21} aria-hidden="true" /></button>
        <div className={`collection-detail-art preview-${preview.theme.id}`}><ArtworkStage><span className="collection-card-art" aria-hidden="true">{preview.artwork}</span></ArtworkStage><div className="collection-detail-pagination"><button type="button" aria-label="Previous design" disabled={previewIndex <= 0} onClick={() => setPreviewId(visible[previewIndex - 1].theme.id)}><ChevronLeft size={20} /></button><span>{previewIndex + 1} of {visible.length}</span><button type="button" aria-label="Next design" disabled={previewIndex < 0 || previewIndex >= visible.length - 1} onClick={() => setPreviewId(visible[previewIndex + 1].theme.id)}><ChevronRight size={20} /></button></div></div>
        <div className="collection-detail-copy"><span className="eyebrow">{preview.theme.category}</span><h2 id="design-preview-title">{preview.theme.name}</h2><p>{preview.theme.description}</p><div className="collection-detail-tags"><span>{preview.theme.family}</span><span>{occasions.find(item => item.id === occasion)?.name}</span>{tradition !== "neutral" && <span>{traditions.find(item => item.id === tradition)?.name}</span>}</div><div className="collection-detail-features"><span><PencilLine size={18} /> Your names & words</span><span><ImagePlus size={18} /> Your favourite photos</span><span><Music2 size={18} /> Music & an animated opening</span></div><Link href={`/customize?${parameters(preview.theme.id)}`} className="button" prefetch={false}>Use this design <ArrowRight size={17} /></Link><Link href={`/demo?${parameters(preview.theme.id)}`} className="button button-secondary" prefetch={false}><Play size={16} /> Open live demo <ArrowUpRight size={16} /></Link><button type="button" className="collection-detail-save" aria-pressed={saved.includes(`${occasion}:${preview.theme.id}`)} onClick={() => saveFavourite(preview.theme)}><Heart size={17} fill={saved.includes(`${occasion}:${preview.theme.id}`) ? "currentColor" : "none"} />{saved.includes(`${occasion}:${preview.theme.id}`) ? "Saved to favourites" : "Save to favourites"}</button><p className="collection-detail-note">Try it with your details before signing up. Your first 2 invitations are free.</p></div>
      </div>
    </dialog>}
  </div>;
}
