import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Create an account", robots: { index: false, follow: false } };
export default function SignupPage() {
  return <AuthPage mode="signup" title="Let’s make something memorable." description="Create your account and save your first 2 invitations free, using any template. Additional invitations will require a paid plan. Payments are coming soon." />;
}
