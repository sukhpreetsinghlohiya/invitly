"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { InvitationTheme, ThemeFamily } from "@/data/themes";

const filters: ("All" | ThemeFamily)[] = ["All", "Indian", "Minimal", "Floral", "Contemporary"];

// Artwork is rendered by the server and passed as slots. Filtering only ships
// this small component; none of the vector drawing code is needed by the gallery.
export function ThemeGallery({ items }: { items: { theme: InvitationTheme; artwork: ReactNode }[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const visible = items.filter(({ theme }) => activeFilter === "All" || theme.family === activeFilter);

  return <div className="collection-gallery">
    <div className="collection-filter-bar"><div className="collection-filters" role="group" aria-label="Filter invitation styles">{filters.map((filter) => <button type="button" key={filter} aria-label={filter} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{filter}<span>{filter === "All" ? items.length : items.filter(({ theme }) => theme.family === filter).length}</span></button>)}</div><p className="collection-count" role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "invitation" : "invitations"}{activeFilter !== "All" ? ` · ${activeFilter}` : " to make your own"}</p></div>
    <div className="collection-grid">{visible.map(({ theme, artwork }) => <article className="collection-card" key={theme.id} style={{ "--collection-accent": theme.accent } as CSSProperties}>
      <Link className={`collection-card-preview preview-${theme.id}`} href={`/demo?theme=${theme.id}`} aria-label={`Preview ${theme.name} invitation`} prefetch={false}><span className="collection-card-number">No. {theme.number}</span><span className="collection-card-art" aria-hidden="true">{artwork}</span><span className="collection-card-preview-label">Explore invitation <span aria-hidden="true">↗</span></span></Link>
      <div className="collection-card-heading"><h3>{theme.name}</h3><span className="collection-swatch" aria-hidden="true" /></div><p className="collection-card-category">{theme.category}</p><p className="collection-card-description">{theme.description}</p><div className="collection-card-actions"><Link href={`/demo?theme=${theme.id}`} aria-label={`Preview ${theme.name}`} prefetch={false}>Preview <span aria-hidden="true">↗</span></Link><Link href={`/customize?theme=${theme.id}`} aria-label={`Customize ${theme.name}`} prefetch={false}>Customize <span aria-hidden="true">→</span></Link></div>
    </article>)}</div>
  </div>;
}
