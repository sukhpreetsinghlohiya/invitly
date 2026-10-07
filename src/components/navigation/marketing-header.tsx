"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import "./navigation.css";
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const toggle = useRef<HTMLElement>(null);
  function close(restore = false) { if (menu.current) menu.current.open = false; if (restore) toggle.current?.focus(); }
  return <header className="marketing-header container" onKeyDown={event => { if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); close(true); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <Brand /><nav className="marketing-desktop-nav" aria-label="Main navigation"><Link href="/templates">The collection</Link><Link href="/#how-it-works">How it works</Link><Link href="/#faqs">FAQs</Link></nav>
    <div className="marketing-header-actions"><Link className="marketing-login" href="/login">Log in</Link><Link className="button button-small" href="/demo">Try a demo <ArrowUpRight size={16} aria-hidden="true" /></Link>
      <details ref={menu} className="marketing-menu" onToggle={event => setOpen(event.currentTarget.open)}>
        <summary ref={toggle} role="button" className="marketing-menu-toggle" aria-controls="mobile-site-navigation" aria-label={open ? "Close navigation" : "Open navigation"}><Menu className="marketing-menu-open-icon" size={22} aria-hidden="true" /><X className="marketing-menu-close-icon" size={22} aria-hidden="true" /></summary>
        <nav id="mobile-site-navigation" className="marketing-mobile-nav" aria-label="Mobile navigation" onClick={event => { if ((event.target as HTMLElement).closest("a")) close(); }}><Link href="/templates">The collection <span aria-hidden="true">↗</span></Link><Link href="/#how-it-works">How it works <span aria-hidden="true">↘</span></Link><Link href="/#faqs">Common questions <span aria-hidden="true">↘</span></Link><Link href="/blog">Journal & ideas <span aria-hidden="true">↗</span></Link><Link href="/login">Host login <span aria-hidden="true">↗</span></Link></nav>
      </details>
    </div>
  </header>;
}
