import { type NextRequest, NextResponse } from "next/server";
import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = (path: string) => {
    // Next can normalize the incoming hostname behind a proxy. Keep callbacks
    // on the explicitly configured application origin (and its cookie host).
    const result = NextResponse.redirect(new URL(path, getSiteUrl()));
    result.headers.set("Cache-Control", "private, no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  if (!getSupabaseConfig()) return response("/setup");
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = request.nextUrl.searchParams.get("next") === "/reset-password" || type === "recovery" ? "/reset-password" : "/dashboard";
  try {
    const supabase = await createClient();
    // Support the default PKCE link and the documented token-hash email template.
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && (type === "email" || type === "recovery")
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : null;
    if (result && !result.error) return response(destination);
  } catch {
    // Never echo auth tokens or provider errors into the URL or rendered page.
  }
  return response("/login?error=verification");
}
