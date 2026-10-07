import Link from "next/link";
import { getSupabaseConfig } from "@/lib/env";
import { AuthForm } from "@/app/auth/auth-form";
import { AuthShell } from "@/app/auth/auth-shell";
import { redirectSignedInHost } from "@/app/auth/session";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await redirectSignedInHost();
  const { error } = await searchParams;
  const message = error === "cancelled" ? "Google sign-in was cancelled. You can try again or use your email."
    : error === "oauth" ? "Google sign-in couldn’t be completed. Please try again or use your email."
    : error ? "That sign-in link has expired or could not be verified. Sign in below or request a fresh confirmation email." : "";
  return <AuthShell title="Welcome back." description="Your people, your plans, your next beautiful celebration.">
    {getSupabaseConfig() ? <>
      {message && <p className="form-error" role="alert">{message}</p>}
      <AuthForm mode="login" />
      <p><Link href="/forgot-password">Forgot your password?</Link></p>
      <p>New here? <Link href="/signup">Create an account</Link></p>
      <p><Link href="/resend-confirmation">Need a new confirmation email?</Link></p>
    </> : <p>Account services are temporarily unavailable. <Link href="/demo">Explore an invitation</Link> while we get things ready.</p>}
  </AuthShell>;
}
