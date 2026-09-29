import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() {
  return <AuthPage mode="forgot" title="A fresh start." description="Enter your account email and we’ll send you a password reset link." />;
}
