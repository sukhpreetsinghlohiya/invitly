"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig, getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };
export type AuthMode = "login" | "signup" | "forgot" | "reset";

export async function authenticate(mode: AuthMode, _previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return { error: "Connect Supabase in .env.local to enable accounts. The demo is available now." };
  if (!["login", "signup", "forgot", "reset"].includes(mode)) return { error: "Choose a valid account action." };
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (mode !== "reset" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) return { error: "Enter a valid email address." };
  if (mode !== "forgot" && (password.length < 8 || password.length > 128)) return { error: "Use a password between 8 and 128 characters." };
  if (mode === "signup" && (name.length < 1 || name.length > 120)) return { error: "Enter your name using 1–120 characters." };
  if ((mode === "signup" || mode === "reset") && password !== String(formData.get("confirmPassword") || "")) return { error: "Your passwords don’t match. Please check both fields." };

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ? getSiteUrl().origin : process.env.NODE_ENV === "development" ? "http://localhost:3000" : getSiteUrl().origin;
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback` } });
      if (error) return { error: error.code === "over_email_send_rate_limit" ? "Too many emails were requested. Please wait a minute before trying again." : "We couldn’t create your account. Try signing in if you already registered, or try again shortly." };
      if (!data.session) return { success: "Check your inbox to confirm your email, then sign in. If you already have an account, use the sign-in page." };
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.code === "email_not_confirmed" ? "Confirm your email using the link in your inbox before signing in." : "We couldn’t sign you in. Check your email and password, or reset your password." };
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
      if (error) return { error: "We couldn’t send the reset email. Please wait a minute and try again." };
      return { success: "If an account uses this email, a password reset link is on its way. Open it in this browser." };
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return { error: "Your reset link has expired. Request a new one from the sign-in page." };
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: "We couldn’t update your password. Choose a different password or request a fresh reset link." };
    }
  } catch {
    return { error: "The account service is unavailable. Check your connection and try again." };
  }
  redirect("/dashboard");
}
