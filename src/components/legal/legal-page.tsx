import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { legalDetails } from "@/lib/legal";
import "./legal.css";
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <><header className="legal-header container"><Brand /><Link href="/">Back to home ↗</Link></header><main id="main" className="legal-page container"><span className="eyebrow">CARE FOR YOUR CELEBRATION</span><h1>{title}</h1><p className="legal-date">Updated 3 October 2026</p>{!legalDetails.complete && <aside className="legal-draft"><strong>Pre-launch draft</strong><p>Operator, contact and deployment details are being reviewed. This notice will be completed before public launch.</p></aside>}{children}<section><h2>Contact</h2>{legalDetails.complete ? <p>{legalDetails.name}, {legalDetails.country}. For privacy or service questions, email <a href={`mailto:${legalDetails.email}`}>{legalDetails.email}</a>.</p> : <p>Invitly’s public support contact will be added here before launch. For a question about a specific invitation, contact the host who sent it to you.</p>}</section><nav aria-label="Legal information"><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of use</Link></nav></main><Footer /></>;
}
