import Link from "next/link";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { getSupabaseConfig } from "@/lib/env";

export const metadata = { title: "Connect your installation", robots: { index: false, follow: false } };

export default function SetupPage() {
  const configured = Boolean(getSupabaseConfig());
  return <><main id="main" className="utility-page container"><Brand /><section className="utility-card">
    <p className="eyebrow">For the person setting things up</p><h1>{configured ? "Your connection settings are in place." : "The demo is ready. Let’s connect your account."}</h1>
    <p>Every invitation preview works without an account. To enable sign-in and the database foundation, connect your own Supabase project.</p>
    <ol>
      <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
      <li>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your project URL and public publishable key. Keep secret keys out of the browser and Git.</li>
      <li>Apply all three versioned migrations in <code>supabase/migrations</code>, in filename order, using the instructions in the README.</li>
      <li>Allow your site URL and <code>/auth/callback</code> redirect in Supabase Auth, then restart the development server.</li>
    </ol>
    <p>{configured ? "These settings have the expected format; this page does not test your remote project. Try signing in to verify the connection." : "Missing configuration is expected for a fresh checkout. No credentials are included in this repository."}</p>
    <Link href={configured ? "/login" : "/demo"} className="button">{configured ? "Try signing in" : "Explore the wedding demo"}</Link>
    <Link href="/" className="button button-secondary">Back to Invitly</Link>
  </section></main><Footer /></>;
}
