import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flower } from "@/components/brand";
import { blogTopics, getBlogTopic, blogReadingMinutes } from "@/data/blog";
import { getPostsByTopic } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return blogTopics.map(topic => ({ slug: topic.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const topic = getBlogTopic(slug); if (!topic) notFound(); return { title: `${topic.name} · The journal`, description: topic.description, alternates: { canonical: `/blog/category/${topic.slug}` } }; }

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const topic = getBlogTopic(slug);
  if (!topic) notFound();
  const posts = await getPostsByTopic(topic.slug);
  return <><section className="journal-intro journal-category-intro container"><Link className="journal-back-link" href="/blog">← Back to the journal</Link><span className="eyebrow">A LITTLE INSPIRATION FOR</span><h1>{topic.name}</h1><p>{topic.description}</p></section><nav className="journal-topics container" aria-label="Blog topics">{blogTopics.map(item => <Link key={item.slug} href={`/blog/category/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined}>{item.name}<span aria-hidden="true">↗</span></Link>)}</nav><section className="journal-library container" aria-label={`${topic.name} articles`}><div className="journal-grid">{posts.map(post => <article className={`journal-card journal-topic-${topic.slug}`} key={post.slug}><Link className="journal-card-art" href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}><span className="journal-card-edition">INVITLY NOTES</span><Flower /><span>{topic.name}</span></Link><div className="journal-card-copy"><p className="journal-card-meta">{blogReadingMinutes(post)} min read</p><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="journal-read-link" href={`/blog/${post.slug}`}>Read the story <span aria-hidden="true">↗</span></Link></div></article>)}</div>{!posts.length && <p className="journal-empty">We’re gathering ideas for this topic. Explore the other notes in the meantime.</p>}</section><section className="journal-invitation-cta container"><h2>Make it <em>your own.</em></h2><p>Start with an invitation for your occasion, then edit every detail.</p><Link href={`/templates?occasion=${topic.occasion}#collection`} className="button">{topic.slug === "ganesh-chaturthi" ? "Explore gathering designs" : "Explore invitation designs"} <span aria-hidden="true">↗</span></Link></section></>;
}
