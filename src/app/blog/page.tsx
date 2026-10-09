import { JournalCard } from "@/components/marketing/journal-card";
import { publicMetadata } from "@/lib/seo";
import Link from "next/link";
import { Flower } from "@/components/brand";
import { blogTopics } from "@/data/blog";
import { getPublishedPosts } from "@/lib/blog";

export const metadata = publicMetadata("The Invitly journal", "Thoughtful invitation wording, practical hosting details and ideas for Indian celebrations. Find a little inspiration for your next gathering.", "/blog");

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <><section className="journal-intro container"><span className="eyebrow"><Flower /> NOTES FROM INVITLY</span><h1>Good words for<br /><em>lovely moments.</em></h1><p>A little inspiration for the invitation. A few thoughtful details for the day. Make every welcome feel like you.</p></section><nav className="journal-topics container" aria-label="Blog topics">{blogTopics.map(topic => <Link key={topic.slug} href={`/blog/category/${topic.slug}`}>{topic.name}<span aria-hidden="true">↗</span></Link>)}</nav><section className="journal-library container" aria-labelledby="journal-library-title"><div className="journal-section-heading"><span className="eyebrow">WORDS, WELCOME & TOGETHERNESS</span><h2 id="journal-library-title">From the journal</h2></div><div className="journal-grid">{posts.map(post => <JournalCard key={post.slug} post={post} />)}</div></section><section className="journal-invitation-cta container"><Flower /><h2>Found the words?<br /><em>Find your invitation.</em></h2><p>Choose a design, add your details, and make every line your own.</p><Link href="/templates" className="button">Explore the collection <span aria-hidden="true">↗</span></Link></section></>;
}
