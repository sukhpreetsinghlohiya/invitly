import type { ReactNode } from "react";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import type { LiveUpdatesConfig } from "@/components/live-announcements";
import { getRequestTimestamp } from "@/lib/request-time";
import { InvitationContent } from "./invitation-content";
import { DemoExperience } from "./demo/demo-experience";
import { getDesign } from "@/data/occasions";
import { getOccasionThemes } from "@/data/occasion-themes";

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
  if (props.mode === "demo") {
    const occasion = props.invitation.occasion || "wedding";
    return <DemoExperience theme={props.theme} occasion={occasion} tradition={props.invitation.tradition || "neutral"} designs={getOccasionThemes(occasion).map(({ id, name }) => ({ id, name }))} music={getDesign(props.invitation).music} musicEnabled={props.musicEnabled !== false}>
      <InvitationContent {...props} musicEnabled={false} renderTimestamp={getRequestTimestamp()} />
    </DemoExperience>;
  }
  return <InvitationContent {...props} renderTimestamp={getRequestTimestamp()} />;
}
