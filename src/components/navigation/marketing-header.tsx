"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import "./navigation.css";
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  function close(restore = false) { setOpen(false); if (restore) toggle.current?.focus(); }
  return <header className="marketing-header container" onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(true); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <Brand /><nav className="marketing-desktop-nav" aria-label="Main navigation"><Link href="/templates">The collection</Link><Link href="/#how-it-works">How it works</Link><Link href="/#faqs">FAQs</Link></nav>
    <div className="marketing-header-actions"><Link className="marketing-login" href="/login">Log in</Link><Link className="button button-small" href="/demo">Try a demo <ArrowUpRight size={16} aria-hidden="true" /></Link><button ref={toggle} type="button" className="marketing-menu-toggle" aria-expanded={open} aria-controls="mobile-site-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(value => !value)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    <nav id="mobile-site-navigation" className="marketing-mobile-nav" aria-label="Mobile navigation" hidden={!open} onClick={event => { if ((event.target as HTMLElement).closest("a")) close(); }}><Link href="/templates">The collection <span>↗</span></Link><Link href="/#how-it-works">How it works <span>↘</span></Link><Link href="/#faqs">Common questions <span>↘</span></Link><Link href="/blog">Journal & ideas <span>↗</span></Link><Link href="/login">Host login <span>↗</span></Link></nav>
  </header>;
}
