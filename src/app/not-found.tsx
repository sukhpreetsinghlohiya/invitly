import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return <main id="main" className="utility-page"><Brand /><div className="utility-card"><span className="eyebrow">404 · A LITTLE DETOUR</span><h1>This invitation hasn&apos;t arrived.</h1><p>The page may have moved. There&apos;s still plenty to celebrate.</p><Link className="button" href="/">Back to Invitly</Link></div></main>;
}
