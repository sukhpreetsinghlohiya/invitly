import type { InvitationRenderProps } from "./invitation-view";
import { OccasionExperience } from "./occasions/occasion-experience";
import { SharedWeddingExperience } from "./wedding/shared-wedding-experience";
import { demoEngagementPhotos } from "@/data/demo-photos";
import "./invitation-personalization.css";
import "./invitation-extras.css";

/** Every wedding design uses the same editable, guest-scoped experience. */
export function InvitationContent(props: InvitationRenderProps) {
  const musicEnabled = props.musicEnabled ?? props.mode === "demo";
  if (props.invitation.occasion && props.invitation.occasion !== "wedding") {
    const photos = props.mode === "demo" && props.invitation.occasion === "engagement" && !props.photos?.length ? demoEngagementPhotos : props.photos;
    return <OccasionExperience {...props} photos={photos} musicEnabled={musicEnabled} />;
  }
  return <SharedWeddingExperience {...props} musicEnabled={musicEnabled} />;
}
