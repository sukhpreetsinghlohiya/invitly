import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Confirm your email", robots: { index: false, follow: false } };
export default function ResendConfirmationPage() {
  return <AuthPage mode="resend" title="Let’s get you in." description="Enter the email you signed up with and we’ll send a fresh confirmation link." />;
}
