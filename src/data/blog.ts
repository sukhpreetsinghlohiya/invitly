import type { OccasionId } from "@/types/invitation";

export type BlogTopicSlug = "wedding" | "engagement" | "birthday" | "housewarming" | "digital-invitations" | "ganesh-chaturthi";
export type BlogTopic = { slug: BlogTopicSlug; name: string; description: string; occasion: OccasionId };
export const blogTopics: BlogTopic[] = [
  { slug: "wedding", name: "Weddings", description: "Words, thoughtful details, and a warm welcome for every part of your wedding.", occasion: "wedding" },
  { slug: "engagement", name: "Engagements", description: "A little promise, a lovely gathering, and an invitation that sounds like you.", occasion: "engagement" },
  { slug: "birthday", name: "Birthdays", description: "Playful wording and practical details for another year of togetherness.", occasion: "birthday" },
  { slug: "housewarming", name: "Housewarming", description: "Invite your people in, with clear directions and a little warmth.", occasion: "housewarming" },
  { slug: "digital-invitations", name: "Digital invitation trends", description: "Useful ideas for invitations that feel personal and work beautifully on a phone.", occasion: "wedding" },
  { slug: "ganesh-chaturthi", name: "Ganesh Chaturthi invitations", description: "Editable wording and clear visiting details for a celebration in your home or community.", occasion: "other" },
];
export function getBlogTopic(slug: string) { return blogTopics.find(topic => topic.slug === slug); }

export type BlogSection = { heading: string; paragraphs: string[]; list?: string[]; quote?: string; quoteLang?: string; links?: { label: string; href: string }[] };
export type BlogPost = {
  title: string;
  slug: string;
  topic: BlogTopicSlug;
  excerpt: string;
  date: string;
  sections: BlogSection[];
  coverImage?: { src: string; alt: string; width: number; height: number };
  status: "draft" | "published";
};

export function blogDate(date: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)); }
export function blogReadingMinutes(post: BlogPost) { const words = post.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.list || []), section.quote || ""]).join(" ").trim().split(/\s+/).length; return Math.max(1, Math.ceil(words / 180)); }
