import { OccasionCover } from "./occasions/occasion-cover";
import { IllustratedCover } from "@/components/wedding/illustrated-cover";
import type { Invitation, ThemeId } from "@/types/invitation";

export function Botanical({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 180 280" fill="none" aria-hidden="true">
    <path d="M90 272C30 178 121 117 82 15M75 191C35 165 26 133 19 106M81 151C125 121 143 77 145 45M81 85C42 73 33 51 32 27" stroke="currentColor" strokeWidth="2" />
    <g fill="currentColor" opacity=".8"><ellipse cx="47" cy="158" rx="12" ry="28" transform="rotate(-40 47 158)" /><ellipse cx="91" cy="184" rx="11" ry="27" transform="rotate(29 91 184)" /><ellipse cx="124" cy="106" rx="11" ry="28" transform="rotate(37 124 106)" /><ellipse cx="65" cy="93" rx="11" ry="23" transform="rotate(-42 65 93)" /><ellipse cx="86" cy="56" rx="9" ry="22" transform="rotate(18 86 56)" /></g>
    <g fill="#e9b7a6"><circle cx="29" cy="25" r="17" /><circle cx="15" cy="31" r="12" /><circle cx="38" cy="39" r="13" /><circle cx="146" cy="44" r="18" /><circle cx="133" cy="35" r="12" /><circle cx="157" cy="29" r="13" /></g><g fill="#c1894d"><circle cx="28" cy="29" r="5" /><circle cx="145" cy="35" r="5" /></g>
  </svg>;
}

// A single renderer keeps the gallery, dashboard and editor faithful to the guest cover.
export function InvitationArt({ theme, invitation, compact = false }: { theme: ThemeId; invitation: Invitation; compact?: boolean }) {
  if (invitation.occasion && invitation.occasion !== "wedding") return <OccasionCover theme={theme} invitation={invitation} compact={compact} />;
  return <IllustratedCover theme={theme} invitation={invitation} compact={compact} />;
}
