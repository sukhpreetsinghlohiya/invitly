import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand, Footer } from "@/components/brand";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SignOutForm } from "./sign-out-form";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!getSupabaseConfig()) redirect("/setup");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return <><main id="main" className="utility-page container"><Brand /><section className="utility-card">
    <p className="eyebrow">You’re signed in</p><h1>A place for your celebrations.</h1>
    <p>Welcome, {data.user.email}. Your secure account is ready.</p>
    <p>Create an event in your host dashboard, or explore the sample invitation to find your style.</p>
    <Link href="/dashboard" className="button">Open my dashboard</Link>
    <SignOutForm />
  </section></main><Footer /></>;
}
