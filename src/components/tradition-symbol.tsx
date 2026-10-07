import { materialTraditionIcons } from "@/data/tradition-icons";
import type { Invitation, TraditionId } from "@/types/invitation";
import styles from "./tradition-symbol.module.css";

export function traditionSymbolLabel(tradition?: TraditionId) {
  if (tradition === "jain") return "Ahimsa hand";
  if (tradition === "parsi") return "Sacred flame";
  return tradition && tradition in materialTraditionIcons
    ? materialTraditionIcons[tradition as keyof typeof materialTraditionIcons].label : null;
}

export function hasTraditionSymbol(invitation: Invitation) {
  return invitation.design?.traditionSymbol !== false && Boolean(traditionSymbolLabel(invitation.tradition));
}

export function TraditionIcon({ tradition }: { tradition: TraditionId }) {
  const icon = tradition in materialTraditionIcons ? materialTraditionIcons[tradition as keyof typeof materialTraditionIcons] : null;
  if (!traditionSymbolLabel(tradition)) return null;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    {icon && <path d={icon.path} />}
    {tradition === "jain" && <>
      <path d="M8 11V6a1 1 0 0 1 2 0v4-6a1 1 0 0 1 2 0v6-7a1 1 0 0 1 2 0v7-5a1 1 0 0 1 2 0v6-3a1 1 0 0 1 2 0v8c0 4-2 6-6 6-3 0-4.5-1.8-6-4l-2.5-4a1.3 1.3 0 0 1 2-1.6L8 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="15.5" r="2.7" fill="none" stroke="currentColor" strokeWidth=".9" />
      {[0, 45, 90, 135].map(angle => <path key={angle} d="M12.5 13v5" transform={`rotate(${angle} 12.5 15.5)`} stroke="currentColor" strokeWidth=".75" />)}
    </>}
    {tradition === "parsi" && <>
      <path d="M12.4 1.5c.9 4-3.7 4.2-3.7 7.4 0 1.9 1.4 3.1 3.3 3.1 2.5 0 4.2-1.8 4.2-4.1 0-1.5-.6-2.5-1.8-3.5.2 2-.6 2.8-1.4 3.1.8-2.9.2-4.5-.6-6Z" />
      <path d="M5 13h14v2l-3.5 2H13v3h4v2H7v-2h4v-3H8.5L5 15Z" />
    </>}
  </svg>;
}

/** A host-selected emblem; names, artwork and wording never select a religion. */
export function TraditionSymbol({ invitation }: { invitation: Invitation }) {
  if (!hasTraditionSymbol(invitation) || !invitation.tradition) return null;
  return <span className={styles.symbol} data-tradition-symbol={invitation.tradition} role="img" aria-label={traditionSymbolLabel(invitation.tradition) || undefined}>
    <TraditionIcon tradition={invitation.tradition} />
  </span>;
}
