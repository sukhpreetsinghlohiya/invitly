import { type NextRequest, NextResponse } from "next/server";
import { getAuthSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = (path: string) => {
    // Next can normalize the incoming hostname behind a proxy. Keep callbacks
    // on the explicitly configured application origin (and its cookie host).
    const result = NextResponse.redirect(new URL(path, getAuthSiteUrl()));
    result.headers.set("Cache-Control", "private, no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  if (!getSupabaseConfig()) return response("/setup");
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return response(providerError === "access_denied" ? "/login?error=cancelled" : "/login?error=oauth");
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = request.nextUrl.searchParams.get("next") === "/reset-password" || type === "recovery" || type === "invite" ? "/reset-password" : "/dashboard";
  // Older templates also linked token hashes here. Keep those links usable,
  // but never consume their one-time token during an email scanner's GET.
  if (!code && tokenHash && tokenHash.length <= 1024 && (type === "email" || type === "recovery" || type === "invite")) {
    const query = new URLSearchParams({ token_hash: tokenHash, type });
    return response(`/auth/confirm?${query}`);
  }
  try {
    if (code) {
      const supabase = await createClient();
      const result = await supabase.auth.exchangeCodeForSession(code);
      if (!result.error) return response(destination);
    }
  } catch {
    // Never echo auth tokens or provider errors into the URL or rendered page.
  }
  return response(destination === "/reset-password" ? "/forgot-password?error=verification" : "/login?error=verification");
}
