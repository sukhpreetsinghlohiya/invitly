import Link from "next/link";
import { getSupabaseConfig } from "@/lib/env";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "./actions";
import { AuthShell } from "./auth-shell";
import { redirectSignedInHost } from "./session";

export async function AuthPage({ mode, title, description }: { mode: AuthMode; title: string; description: string }) {
  if (mode === "signup") await redirectSignedInHost();
  return <AuthShell title={title} description={description}>
    {getSupabaseConfig() ? <AuthForm mode={mode} /> : <p>Account services are temporarily unavailable. <Link href="/demo">Explore an invitation</Link> while we get things ready.</p>}
    <p>{mode === "signup" ? "Already have an account? " : ""}<Link href="/login">{mode === "signup" ? "Sign in" : "Back to sign in"}</Link></p>
  </AuthShell>;
}
