import Image from "next/image";
import Link from "next/link";
import { Flower } from "@/components/brand";
import { blogReadingMinutes, getBlogTopic, type BlogPost } from "@/data/blog";

export function JournalCard({ post, headingLevel = 3 }: { post: BlogPost; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const topic = getBlogTopic(post.topic)!;
  return <article className={`journal-card journal-topic-${post.topic}`}>
    <Link className={`journal-card-art${post.coverImage ? " journal-card-art-image" : ""}`} href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
      {post.coverImage ? <Image src={post.coverImage.src} alt={post.coverImage.alt} fill sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 45vw, 380px" /> : <><span className="journal-card-edition">INVITLY NOTES</span><Flower /><span>{topic.name}</span></>}
    </Link>
    <div className="journal-card-copy">
      <p className="journal-card-meta">{topic.name}<span aria-hidden="true">·</span>{blogReadingMinutes(post)} min read</p>
      <Heading><Link href={`/blog/${post.slug}`}>{post.title}</Link></Heading>
      <p>{post.excerpt}</p>
      <Link className="journal-read-link" href={`/blog/${post.slug}`}>Read the story <span aria-hidden="true">↗</span></Link>
    </div>
  </article>;
}
