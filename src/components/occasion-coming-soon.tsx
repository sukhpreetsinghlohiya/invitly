import Link from "next/link";
import { Brand } from "@/components/brand";
import { OccasionCardArt } from "@/components/occasion-card-art";
import { getOccasion } from "@/data/occasions";
import type { OccasionId } from "@/types/invitation";
import styles from "./occasion-coming-soon.module.css";

export function ComingSoonBadge() {
  return <small className={styles.badge}>Coming soon</small>;
}

export function OccasionComingSoon({ occasion }: { occasion: OccasionId }) {
  return <div className={styles.page} data-coming-soon={occasion}>
    <header><Brand /><Link href="/templates#occasion-collections-title">The collection <span aria-hidden="true">↗</span></Link></header>
    <main id="main" className={styles.content}>
      <div className={styles.art}><OccasionCardArt occasion={occasion} /></div>
      <ComingSoonBadge /><h1>{getOccasion(occasion).name}<br /><em>invitations.</em></h1>
      <p>We’re putting the finishing touches on this collection. Wedding and engagement invitations are ready to make your own.</p>
      <div className={styles.actions}><Link className="button" href="/templates?occasion=wedding#collection">Explore weddings <span aria-hidden="true">↗</span></Link><Link className="button button-secondary" href="/templates?occasion=engagement#collection">Explore engagements <span aria-hidden="true">↗</span></Link></div>
    </main>
  </div>;
}
