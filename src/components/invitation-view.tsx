import type { ReactNode } from "react";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import type { LiveUpdatesConfig } from "@/components/live-announcements";
import { getRequestTimestamp } from "@/lib/request-time";
import { InvitationContent } from "./invitation-content";

export type InvitationViewProps = {
  invitation: Invitation;
  theme: ThemeId;
  mode: "demo" | "published" | "guest" | "preview";
  musicEnabled?: boolean;
  photos?: EventPhoto[];
  calendarHref?: string;
  rsvpContent?: ReactNode;
  liveUpdates?: LiveUpdatesConfig;
  previewBackHref?: string;
};

export type InvitationRenderProps = InvitationViewProps & { renderTimestamp: number };

export function InvitationView(props: InvitationViewProps) {
  return <InvitationContent {...props} renderTimestamp={getRequestTimestamp()} />;
}
