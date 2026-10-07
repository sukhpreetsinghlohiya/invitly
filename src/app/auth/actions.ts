"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseConfig, getAuthSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
  code?: "rate_limited";
  retryAfter?: number;
  notBefore?: number;
  confirmationRequired?: boolean;
};
export type AuthMode = "login" | "signup" | "forgot" | "reset" | "resend";

// Supabase enforces the real limits. Its SDK exposes status/code, but not the
// upstream Retry-After header. This is a supplementary UI pause, not a quota
// reset guarantee or a security boundary. Never trust previous client state to
// enforce an authentication limit.
function emailCooldown(): Pick<AuthState, "retryAfter" | "notBefore"> {
  return { retryAfter: 60, notBefore: Date.now() + 60_000 };
}

function rateLimitState(error: Pick<AuthError, "status" | "code">): AuthState | null {
  if (error.status !== 429 && error.code !== "over_email_send_rate_limit" && error.code !== "over_request_rate_limit") return null;
  return {
    code: "rate_limited",
    error: "Too many requests right now. Please wait before trying again. If this continues, allow a little more time.",
    ...emailCooldown(),
  };
}

function resetEmailSent(): AuthState {
  return {
    success: "If an account uses this email, a password reset link is on its way. Check your spam folder too.",
    ...emailCooldown(),
  };
}

export async function authenticate(mode: AuthMode, _previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return { error: "Account services are temporarily unavailable. Please try again later." };
  if (!["login", "signup", "forgot", "reset", "resend"].includes(mode)) return { error: "Choose a valid account action." };
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (mode !== "reset" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) return { error: "Enter a valid email address." };
  if (mode === "login" && (!password || password.length > 128)) return { error: "Enter your password." };
  if ((mode === "signup" || mode === "reset") && (password.length < 8 || password.length > 128)) return { error: "Use a password between 8 and 128 characters." };
  if (mode === "signup" && (name.length < 1 || name.length > 120)) return { error: "Enter your name using 1–120 characters." };
  if ((mode === "signup" || mode === "reset") && password !== String(formData.get("confirmPassword") || "")) return { error: "Your passwords don’t match. Please check both fields." };

  try {
    const supabase = await createClient();
    if (mode === "signup") {
      const origin = getAuthSiteUrl().origin;
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback` } });
      if (error) return rateLimitState(error) ?? { error: error.code === "weak_password" ? "Choose a stronger password. Try a longer phrase with letters, numbers and symbols." : "We couldn’t create your account. Try signing in if you already registered, or try again shortly." };
      if (!data.session) return { success: "Check your inbox to confirm your email. Check spam too. If you already have an account, use the sign-in page.", confirmationRequired: true, ...emailCooldown() };
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return rateLimitState(error) ?? { error: error.code === "email_not_confirmed" ? "Confirm your email using the link in your inbox before signing in." : "We couldn’t sign you in. Check your email and password, or reset your password.", confirmationRequired: error.code === "email_not_confirmed" };
    } else if (mode === "resend") {
      const origin = getAuthSiteUrl().origin;
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
      if (error && !["user_not_found", "email_already_confirmed"].includes(error.code || "")) return rateLimitState(error) ?? { error: "We couldn’t send the confirmation email. Please try again shortly." };
      return { success: "If this email has an account awaiting confirmation, a fresh link is on its way. Check your inbox and spam folder.", ...emailCooldown() };
    } else if (mode === "forgot") {
      const origin = getAuthSiteUrl().origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
      if (error && error.code !== "user_not_found") return rateLimitState(error) ?? { error: "We couldn’t send the reset email. Please try again shortly." };
      return resetEmailSent();
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) return rateLimitState(authError) ?? { error: "Your reset link has expired. Request a new one from the sign-in page." };
      if (!user) return { error: "Your reset link has expired. Request a new one from the sign-in page." };
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return rateLimitState(error) ?? { error: "We couldn’t update your password. Choose a different password or request a fresh reset link." };
    }
  } catch {
    return { error: "The account service is unavailable. Check your connection and try again." };
  }
  redirect("/dashboard");
}

export async function signInWithGoogle(): Promise<AuthState> {
  const config = getSupabaseConfig();
  if (!config) return { error: "Account services are temporarily unavailable. Please try again later." };
  let destination: string;
  try {
    // A disabled provider otherwise sends the visitor to a raw Auth API error.
    const settings = await fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.key }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!settings.ok || (await settings.json()).external?.google !== true) return { error: "Google sign-in is unavailable right now. Please continue with email." };
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: new URL("/auth/callback", getAuthSiteUrl()).href, queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) return { error: "Google sign-in is unavailable right now. Please use your email or try again later." };
    destination = data.url;
  } catch {
    return { error: "We couldn’t connect to Google sign-in. Check your connection and try again." };
  }
  // Keep the framework redirect outside the catch; Next attaches the PKCE cookies.
  redirect(destination);
}

export async function confirmEmail(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const tokenHash = String(formData.get("token_hash") || "");
  const type = String(formData.get("type") || "");
  if (!tokenHash || tokenHash.length > 1024 || !["email", "recovery", "invite"].includes(type)) return { error: "This link is invalid. Request a new email and try again." };
  try {
    if (!getSupabaseConfig()) return { error: "Account services are temporarily unavailable. Please try again later." };
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "recovery" | "invite" });
    if (error) return rateLimitState(error) ?? { error: "This link has expired or has already been used. Request a new email and try again." };
  } catch {
    return { error: "We couldn’t verify this link. Check your connection and try again." };
  }
  redirect(type === "recovery" || type === "invite" ? "/reset-password" : "/dashboard");
}
