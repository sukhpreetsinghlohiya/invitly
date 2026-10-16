import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon } from "@/components/occasion-coming-soon";
import type { Metadata } from "next";
import { InvitationView } from "@/components/invitation-view";
import { getDesign, getOccasion, traditions } from "@/data/occasions";
import { occasionDemo } from "@/data/occasion-demos";
import { resolveTheme } from "@/data/themes";
import { getOccasionThemes } from "@/data/occasion-themes";
import { getFestivalPreset } from "@/data/festivals";

export const metadata: Metadata = {
  title: "Preview your occasion",
  description: "Explore original invitation designs for weddings, engagements and festivals, with animated openings.",
  robots: { index: false, follow: true },
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ theme?: string; occasion?: string; tradition?: string; opening?: string; festival?: string }> }) {
  const params = await searchParams;
  const occasion = getOccasion(params.occasion);
  if (!isOccasionAvailable(occasion.id)) return <OccasionComingSoon occasion={occasion.id} />;
  const theme = params.theme ? resolveTheme(params.theme) : getOccasionThemes(occasion.id)[0].id;
  const sample = occasionDemo(occasion.id, theme, getFestivalPreset(params.festival).id);
  const opening = "envelope" as const;
  const invitation = { ...sample, tradition: traditions.find(item => item.id === params.tradition)?.id || "neutral" as const, design: { ...getDesign(sample), opening: { style: opening, icon: "monogram" as const, line: "An invitation, just for you" } } };
  return <InvitationView invitation={invitation} theme={theme} mode="demo" />;
}
