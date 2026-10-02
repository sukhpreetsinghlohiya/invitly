import type { CSSProperties } from "react";
import { getDesign } from "@/data/occasions";
import type { Invitation } from "@/types/invitation";

export function invitationPresentation(invitation: Invitation) {
  const design = getDesign(invitation);
  const palettes = { rose: ["#713d4c", "#efe3df"], sage: ["#355341", "#e6eadf"], indigo: ["#293d60", "#e6e7ee"] };
  const palette = design.palette === "original" ? null : palettes[design.palette];
  const style = Object.fromEntries(design.sectionOrder.map((section, index) => [`--${section}-order`, 10 + index * 10])) as CSSProperties;
  if (palette) Object.assign(style, { "--custom-accent": palette[0], "--custom-light": palette[1] });
  return { style, "data-invitation-root": true, "data-occasion": invitation.occasion || "wedding", "data-motion": design.motion || "gentle", "data-palette": design.palette, "data-typography": design.typography, "data-decorations": design.decoration ? "on" : "off" };
}
