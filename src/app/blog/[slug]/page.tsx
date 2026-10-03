import { brandImage, publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flower } from "@/components/brand";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { getBlogTopic, blogDate, blogReadingMinutes } from "@/data/blog";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() { return (await getPublishedPosts()).map(post => ({ slug: post.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const post = await getPublishedPost(slug); if (!post) notFound(); return { ...publicMetadata(post.title, post.excerpt, `/blog/${post.slug}`), twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [post.coverImage?.src || brandImage] }, openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date, url: `/blog/${post.slug}`, ...(post.coverImage ? { images: [{ url: post.coverImage.src, width: post.coverImage.width, height: post.coverImage.height, alt: post.coverImage.alt }] } : { images: [brandImage] }) } }; }

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const topic = getBlogTopic(post.topic)!;
  const available = isOccasionAvailable(topic.occasion);
  const related = (await getPublishedPosts()).filter(item => item.slug !== post.slug).slice(0, 3);
  return <><article className={`journal-article journal-topic-${post.topic}`}><header className="journal-article-header container"><Link className="journal-back-link" href={`/blog/category/${topic.slug}`}>← {topic.name}</Link><span className="eyebrow">THE INVITLY JOURNAL</span><h1>{post.title}</h1><p className="journal-article-excerpt">{post.excerpt}</p><div className="journal-article-meta"><Link href={`/blog/category/${topic.slug}`}>{topic.name}</Link><span aria-hidden="true">·</span><time dateTime={post.date}>{blogDate(post.date)}</time><span aria-hidden="true">·</span><span>{blogReadingMinutes(post)} min read</span></div></header>{post.coverImage && <div className="journal-cover container"><Image src={post.coverImage.src} alt={post.coverImage.alt} width={post.coverImage.width} height={post.coverImage.height} sizes="(max-width: 800px) calc(100vw - 40px), 900px" preload /></div>}<div className="journal-article-body">{post.sections.map((section, index) => <section key={section.heading} aria-labelledby={`section-${index}`}><h2 id={`section-${index}`}>{section.heading}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.quote && <blockquote lang={section.quoteLang || "en-IN"}><Flower /><p>{section.quote}</p></blockquote>}{section.list && <ul>{section.list.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}<aside className="journal-article-cta">{!available && <ComingSoonBadge />}<span className="eyebrow">YOUR WORDS, YOUR WELCOME</span><h2>{available ? "Bring your invitation to life." : "More moments, coming soon."}</h2><p>{available ? "Choose a design, add your details, and keep every suggested word editable." : "Invitations for this occasion are coming soon. Our wedding and engagement collections are ready to make your own."}</p><Link className="button" href={available ? `/templates?occasion=${topic.occasion}#collection` : "/templates#occasion-collections-title"}>{available ? "Find your design" : "Explore available designs"} <span aria-hidden="true">↗</span></Link></aside></div></article><section className="journal-related container" aria-labelledby="journal-related-title"><span className="eyebrow">A LITTLE MORE INSPIRATION</span><h2 id="journal-related-title">Keep reading</h2><div>{related.map(item => <Link key={item.slug} href={`/blog/${item.slug}`}><span>{getBlogTopic(item.topic)!.name}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></Link>)}</div><Link href="/blog" className="journal-read-link">All journal notes <span aria-hidden="true">↗</span></Link></section></>;
}
