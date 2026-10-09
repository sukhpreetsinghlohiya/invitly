import { JournalCard } from "@/components/marketing/journal-card";
import { publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { blogTopics, getBlogTopic } from "@/data/blog";
import { getPostsByTopic } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return blogTopics.map(topic => ({ slug: topic.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const topic = getBlogTopic(slug); if (!topic) notFound(); return publicMetadata(`${topic.name} · The journal`, topic.description, `/blog/category/${topic.slug}`); }

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const topic = getBlogTopic(slug);
  if (!topic) notFound();
  const posts = await getPostsByTopic(topic.slug);
  const available = isOccasionAvailable(topic.occasion);
  return <><section className="journal-intro journal-category-intro container"><Link className="journal-back-link" href="/blog">← Back to the journal</Link><span className="eyebrow">A LITTLE INSPIRATION FOR</span><h1>{topic.name}</h1><p>{topic.description}</p></section><nav className="journal-topics container" aria-label="Blog topics">{blogTopics.map(item => <Link key={item.slug} href={`/blog/category/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined}>{item.name}<span aria-hidden="true">↗</span></Link>)}</nav><section className="journal-library container" aria-label={`${topic.name} articles`}><div className="journal-grid">{posts.map(post => <JournalCard key={post.slug} post={post} headingLevel={2} />)}</div>{!posts.length && <p className="journal-empty">We’re gathering ideas for this topic. Explore the other notes in the meantime.</p>}</section><section className="journal-invitation-cta container">{!available && <ComingSoonBadge />}<h2>{available ? <>Make it <em>your own.</em></> : <>More moments, <em>coming soon.</em></>}</h2><p>{available ? "Start with an invitation for your occasion, then edit every detail." : "Invitations for this occasion are coming soon. Explore our wedding and engagement collections while you gather your ideas."}</p><Link href={available ? `/templates?occasion=${topic.occasion}#collection` : "/templates#occasion-collections-title"} className="button">{available ? "Explore invitation designs" : "Explore available designs"} <span aria-hidden="true">↗</span></Link></section></>;
}
