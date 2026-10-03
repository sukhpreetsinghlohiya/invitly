import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon } from "@/components/occasion-coming-soon";
import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation-view";
import { getOccasion, traditions } from "@/data/occasions";
import { occasionDemo } from "@/data/occasion-demos";
import { resolveTheme } from "@/data/themes";
import { getOccasionThemes } from "@/data/occasion-themes";

export const metadata: Metadata = {
  title: "Preview your occasion — Invitly",
  description: "Explore original Indian invitation designs for weddings and engagements. More occasions are coming soon.",
  robots: { index: false, follow: true },
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ theme?: string; occasion?: string; tradition?: string }> }) {
  const params = await searchParams;
  const occasion = getOccasion(params.occasion);
  if (!isOccasionAvailable(occasion.id)) return <OccasionComingSoon occasion={occasion.id} />;
  const theme = params.theme ? resolveTheme(params.theme) : getOccasionThemes(occasion.id)[0].id;
  const sample = occasionDemo(occasion.id, theme);
  const invitation = { ...sample, tradition: traditions.find(item => item.id === params.tradition)?.id || "neutral" as const };
  return <InvitationView invitation={invitation} theme={theme} mode="demo" />;
}
