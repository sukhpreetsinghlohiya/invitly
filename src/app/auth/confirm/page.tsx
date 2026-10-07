import Link from "next/link";
import { AuthShell } from "../auth-shell";
import { ConfirmForm } from "./confirm-form";

export const metadata = { title: "Your secure email link", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export const dynamic = "force-dynamic";

// Mail scanners can visit links without consuming their tokens. Verification
// happens only after a deliberate POST from the confirmation button.
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string }> }) {
  const { token_hash: tokenHash, type = "" } = await searchParams;
  const valid = typeof tokenHash === "string" && tokenHash.length > 0 && tokenHash.length <= 1024 && ["email", "recovery", "invite"].includes(type);
  const recovery = type === "recovery";
  const label = recovery ? "Continue to reset password" : type === "invite" ? "Accept invitation" : "Confirm my email";
  return <AuthShell title={valid ? recovery ? "A fresh start." : "You’re nearly there." : "Let’s try a fresh link."} description={valid ? "Continue below to securely finish your request." : "This email link is incomplete or invalid. Request a new one to continue."}>
    {valid && <ConfirmForm tokenHash={tokenHash} type={type} label={label} />}
    <p><Link href={recovery || type === "invite" ? "/forgot-password" : "/resend-confirmation"}>Request a fresh email</Link> · <Link href="/login">Back to sign in</Link></p>
  </AuthShell>;
}
