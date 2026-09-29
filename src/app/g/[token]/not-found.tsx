import Link from "next/link";
import { Brand } from "@/components/brand";

export default function GuestLinkUnavailable() {
  return <main id="main" className="utility-page container"><Brand /><section className="utility-card"><p className="eyebrow">A little help from your hosts</p><h1>This invitation link is unavailable.</h1><p>Ask your hosts for your latest private link. The invitation may not be published yet, or your link may have been replaced.</p><Link className="button button-secondary" href="/">Visit Invitly</Link></section></main>;
}
