import Link from "next/link";
import { Brand, Flower } from "@/components/brand";
import { SocialLinks } from "@/components/marketing/social-links";
import { blogTopics } from "@/data/blog";
import { occasions } from "@/data/occasions";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import "./marketing/footer.css";

export function Footer() {
  return <footer className="marketing-footer">
    <div className="container">
      <div className="footer-floral-rule" aria-hidden="true"><span /><Flower /><span /></div>
      <div className="footer-main">
        <div className="footer-brand-story"><Brand /><h2>For all that brings<br />us <em>together.</em></h2><p>Thoughtful wedding and engagement invitations, made for your story and the people closest to your heart.</p><Link className="footer-create" href="/customize">Begin your invitation <span aria-hidden="true">↗</span></Link></div>
        <nav className="footer-link-group" aria-label="Explore Invitly"><h3>A little exploring</h3><Link href="/templates">Browse the collection</Link><Link href="/demo">Open a live demo</Link><Link href="/blog">Blog & ideas</Link><Link href="/#how-it-works">How Invitly works</Link><Link href="/#faqs">Common questions</Link><Link href="/login">Host login</Link><Link href="/dashboard">Your dashboard</Link></nav>
        <nav className="footer-link-group" aria-label="Invitation occasions"><h3>For your moment</h3>{occasions.map(occasion => isOccasionAvailable(occasion.id)
          ? <Link key={occasion.id} href={`/templates?occasion=${occasion.id}#collection`}>{occasion.id === "wedding" ? "Weddings" : "Engagements"}</Link>
          : <span key={occasion.id} className="footer-upcoming" data-coming-soon={occasion.id}><span>{occasion.id === "remembrance" ? "Remembrance" : occasion.name}</span><ComingSoonBadge /></span>)}<Link href="/templates#occasion-collections-title">The collections <span aria-hidden="true">↗</span></Link></nav>
        <nav className="footer-link-group footer-blog-links" aria-label="From the blog"><h3>From the blog</h3>{blogTopics.map(topic => <Link key={topic.slug} href={`/blog/category/${topic.slug}`}>{topic.name}</Link>)}</nav>
      </div>
      <SocialLinks />
      <div className="footer-bottom"><p>A little link. A lot of togetherness.</p><span>Made by Sukhpreet <span aria-hidden="true">♡</span></span></div>
    </div>
  </footer>;
}
