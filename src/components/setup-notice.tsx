import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSupabaseConfig } from "@/lib/env";

export function SetupNotice() {
  if (getSupabaseConfig()) return null;
  return <aside className="setup-notice"><span><strong>Demo mode</strong><span className="setup-notice-detail"> · Supabase isn&apos;t configured. You can still explore every theme.</span></span><Link href="/setup">Set up Supabase <ArrowUpRight size={14} /></Link></aside>;
}
