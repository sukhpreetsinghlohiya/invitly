import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getBlogTopic, type BlogPost, type BlogSection } from "@/data/blog";

const contentDirectory = path.join(process.cwd(), "content", "blog");
const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
function isSection(value: unknown): value is BlogSection {
  return isRecord(value) && isText(value.heading) && Array.isArray(value.paragraphs) && value.paragraphs.length > 0 && value.paragraphs.every(isText)
    && (value.list === undefined || Array.isArray(value.list) && value.list.every(isText))
    && (value.quote === undefined || isText(value.quote)) && (value.quoteLang === undefined || typeof value.quoteLang === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value.quoteLang))
    && (value.links === undefined || Array.isArray(value.links) && value.links.every(link => isRecord(link) && isText(link.label) && isText(link.href) && /^\/(?:blog\/[a-z0-9/-]+|templates(?:\?[a-z0-9=&-]+)?|demo\?[a-z0-9=&-]+)$/.test(link.href)));
}
function parsePost(value: unknown, filename: string): BlogPost {
  const fail = () => { throw new Error(`Invalid blog content: ${filename}. Check required text, slug, topic, date, sections, image and status.`); };
  if (!isRecord(value)) return fail();
  if (![value.title, value.slug, value.topic, value.excerpt, value.date].every(isText)) return fail();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug as string) || (value.slug as string).length > 120 || !getBlogTopic(value.topic as string)) return fail();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date as string)) return fail();
  const parsedDate = new Date(`${value.date}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value.date) return fail();
  if (value.status !== "draft" && value.status !== "published") return fail();
  if (!Array.isArray(value.sections) || !value.sections.length || !value.sections.every(isSection)) return fail();
  if (value.coverImage !== undefined) {
    const image = value.coverImage;
    if (!isRecord(image) || !isText(image.src) || !/^\/images\/[A-Za-z0-9/_-]+\.(?:webp|png|jpe?g|avif)$/.test(image.src) || !isText(image.alt) || !Number.isInteger(image.width) || !Number.isInteger(image.height) || Number(image.width) < 1 || Number(image.height) < 1) return fail();
  }
  return value as BlogPost;
}

// Only this server module reads content; draft bodies never enter public route props.
const readPosts = cache(async (): Promise<BlogPost[]> => {
  const files = (await readdir(contentDirectory)).filter(file => file.endsWith(".json")).sort();
  const posts = await Promise.all(files.map(async file => parsePost(JSON.parse(await readFile(path.join(contentDirectory, file), "utf8")), file)));
  const slugs = new Set<string>();
  for (const post of posts) { if (slugs.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`); slugs.add(post.slug); }
  return posts;
});
export const getPublishedPosts = cache(async () => (await readPosts()).filter(post => post.status === "published").sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)));
export async function getPublishedPost(slug: string) { return (await getPublishedPosts()).find(post => post.slug === slug); }
export async function getPostsByTopic(topicSlug: string) { return (await getPublishedPosts()).filter(post => post.topic === topicSlug); }
