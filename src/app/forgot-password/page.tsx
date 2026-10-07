import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthPage mode="forgot" title="A fresh start." description={error === "verification" ? "Your password reset link has expired or could not be verified. Enter your account email for a fresh link." : "Enter your account email and we’ll send you a password reset link."} />;
}
