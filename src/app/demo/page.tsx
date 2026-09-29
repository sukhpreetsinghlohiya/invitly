import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation-view";
import { demoInvitation } from "@/data/demo-invitation";
import { resolveTheme } from "@/data/themes";

export const metadata: Metadata = {
  title: `${demoInvitation.couple.join(" & ")} — An Invitly celebration`,
  description: `You're invited to a little forever. Explore our fictional wedding in ${demoInvitation.city}, and an invitation made for your phone.`,
  robots: { index: false, follow: true },
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const theme = resolveTheme((await searchParams).theme);
  return <InvitationView invitation={demoInvitation} theme={theme} mode="demo" />;
}
