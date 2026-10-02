import { youtubeVideoId } from "@/data/music";

export type InvitationVideoSource = { provider: "youtube" | "vimeo"; embedUrl: string; externalUrl: string };

/** Only video IDs from supported HTTPS hosts can become an embed destination. */
export function parseInvitationVideo(value: string): InvitationVideoSource | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const youtube = youtubeVideoId(value);
    if (youtube) return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=0&rel=0`, externalUrl: `https://www.youtube.com/watch?v=${youtube}` };
    if (!["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) return null;
    const match = (url.hostname === "player.vimeo.com" ? /^\/video\/(\d{5,12})\/?$/ : /^\/(\d{5,12})(?:\/([a-zA-Z0-9]{6,32}))?\/?$/).exec(url.pathname);
    if (!match) return null;
    const hash = match[2] || url.searchParams.get("h") || "";
    if (hash && !/^[a-zA-Z0-9]{6,32}$/.test(hash)) return null;
    const query = new URLSearchParams({ autoplay: "0", dnt: "1", ...(hash ? { h: hash } : {}) });
    return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${match[1]}?${query}`, externalUrl: `https://vimeo.com/${match[1]}${hash ? `/${hash}` : ""}` };
  } catch { return null; }
}
