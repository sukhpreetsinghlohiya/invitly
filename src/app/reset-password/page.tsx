import { redirect } from "next/navigation";
import { AuthPage } from "@/app/auth/auth-page";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) redirect("/forgot-password");
  }
  return <AuthPage mode="reset" title="Choose a new password." description="Make it memorable for you and difficult to guess." />;
}
