export const supabaseSetupMessage =
  "Supabase is not configured yet. Copy .env.example to .env.local, add your project URL and publishable key, then restart the dev server. The demo works without them.";

// Read public variables explicitly so Next.js can inline them in browser bundles.
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !key.startsWith("sb_publishable_") || key.length < 20) return null;
  try {
    const parsed = new URL(url);
    if (!(["http:", "https:"].includes(parsed.protocol))) return null;
    return { url, key };
  } catch {
    return null;
  }
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) throw new Error(supabaseSetupMessage);
  return config;
}

export function getSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://invitly.co.in");
  } catch {
    return new URL("https://invitly.co.in");
  }
}

// Auth callbacks must share the host that stores the session cookies. Use one
// origin for signup, recovery, OAuth and verification, including local dev.
export function getAuthSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = new URL(configured || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://invitly.co.in"));
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid auth site URL.");
  return new URL(url.origin);
}
