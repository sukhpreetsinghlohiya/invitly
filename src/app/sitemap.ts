import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getPublishedPosts } from "@/lib/blog";
import { blogTopics } from "@/data/blog";
import { legalDetails } from "@/lib/legal";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, getSiteUrl()).href;
  const posts = await getPublishedPosts();
  const paths = ["/", "/templates", "/templates?occasion=engagement", "/blog", ...blogTopics.map(topic => `/blog/category/${topic.slug}`), ...(legalDetails.complete ? ["/privacy", "/terms"] : [])];
  return [...paths.map(path => ({ url: url(path) })), ...posts.map(post => ({ url: url(`/blog/${post.slug}`), lastModified: post.date }))];
}
