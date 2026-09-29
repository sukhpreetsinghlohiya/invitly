import { notFound, permanentRedirect } from "next/navigation";
import { isInvitationSlug } from "@/lib/public-invitation";

export const dynamic = "force-dynamic";
export default async function LegacyInvitation({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isInvitationSlug(slug)) notFound();
  permanentRedirect(`/i/${slug}`);
}
