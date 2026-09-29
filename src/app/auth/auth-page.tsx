import Link from "next/link";
import { Brand, Footer } from "@/components/brand";
import { getSupabaseConfig } from "@/lib/env";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "./actions";

export function AuthPage({ mode, title, description }: { mode: AuthMode; title: string; description: string }) {
  return <><main id="main" className="utility-page container"><Brand /><section className="utility-card"><p className="eyebrow">A warm welcome</p><h1>{title}</h1><p>{description}</p>
    {getSupabaseConfig() ? <AuthForm mode={mode} /> : <><p>Account services need a Supabase connection. The public demo is ready to explore.</p><Link className="button" href="/setup">View setup instructions</Link></>}
    <p><Link href="/login">Back to sign in</Link> · <Link href="/demo">Explore the demo</Link></p>
  </section></main><Footer /></>;
}
