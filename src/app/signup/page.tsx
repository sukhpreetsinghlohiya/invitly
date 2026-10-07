import { AuthPage } from "@/app/auth/auth-page";
export const metadata = { title: "Create an account", robots: { index: false, follow: false } };
export default function SignupPage() {
  return <AuthPage mode="signup" title="Let’s make it yours." description="Your first two invitations are on us. Choose a design, add your story, and bring your people together." />;
}
