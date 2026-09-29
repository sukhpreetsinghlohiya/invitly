import Link from "next/link";
import { Brand, Footer } from "@/components/brand";
import { getSupabaseConfig } from "@/lib/env";
import { AuthForm } from "@/app/auth/auth-form";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(getSupabaseConfig());
  return <><main id="main" className="utility-page container"><Brand /><section className="utility-card">
    <p className="eyebrow">Your next celebration</p><h1>Welcome to Invitly.</h1>
    {configured ? <><p>Sign in to bring your next celebration to life.</p>
      {error && <p className="form-error" role="alert">That sign-in link has expired or could not be verified. Request a fresh link below.</p>}
      <AuthForm mode="login" /><p><Link href="/forgot-password">Forgot your password?</Link></p><p>New here? <Link href="/signup">Create an account</Link></p></> : <>
      <p>The invitation demo is ready to explore. Account sign-in will be available once this installation is connected to Supabase.</p>
      <Link href="/setup" className="button">View setup instructions</Link>
    </>}
    <Link href="/demo" className="button button-secondary">Explore the wedding demo</Link>
  </section></main><Footer /></>;
}
