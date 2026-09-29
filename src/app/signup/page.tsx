import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Create an account", robots: { index: false, follow: false } };
export default function SignupPage() {
  return <AuthPage mode="signup" title="Let’s make something memorable." description="Create your host account. Your guests can open your invitation without signing in." />;
}
