import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Brand, Flower } from "@/components/brand";
import styles from "./auth-form.module.css";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className={styles.page}>
    <header className={styles.header}><Brand /><Link href="/templates"><ArrowLeft size={15} /> Back to the collection</Link></header>
    <main id="main" className={styles.layout}>
      <aside className={styles.story} aria-label="Made for your celebration">
        <span className={styles.eyebrow}>A LITTLE LINK. A LOT OF TOGETHERNESS.</span>
        <h2>Every great day<br /> starts with<br /> <em>“you’re invited.”</em></h2>
        <div className={styles.stationery} aria-hidden="true"><div className={styles.backCard} /><div className={styles.frontCard}><Flower /><span>TOGETHER WITH OUR FAMILIES</span><strong>Aarav <i>&</i> Meera</strong><span>WE SAVED YOU A LITTLE PLACE<br />IN OUR BIG DAY.</span><div>WITH LOVE, ALWAYS</div></div><span className={styles.seal}>a & m</span></div>
        <p>Your story, your people, one beautiful invitation.</p>
        <ul><li><Check size={15} /> Wedding & engagement designs</li><li><Check size={15} /> Personal guest links & RSVPs</li><li><Check size={15} /> Your first two invitations free</li></ul>
        <Link className={styles.demoLink} href="/demo">Take a peek at a live invitation ↗</Link>
      </aside>
      <section className={styles.panel}><div className={styles.panelInner}><span className="eyebrow">YOUR INVITLY ACCOUNT</span><h1>{title}</h1><p className={styles.description}>{description}</p>{children}</div><p className={styles.legal}><Link href="/privacy">Privacy</Link><span>·</span><Link href="/terms">Terms</Link><span>·</span>Made for your moments</p></section>
    </main>
  </div>;
}
