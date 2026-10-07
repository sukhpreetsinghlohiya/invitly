"use client";

import { isOccasionAvailable } from "@/data/occasion-availability";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { applyOccasion, getDesign, occasions, sectionLabels, traditions } from "@/data/occasions";
import { getOccasionThemes } from "@/data/occasion-themes";
import { InvitationArt } from "@/components/invitation-art";
import { IllustratedCover } from "@/components/wedding/illustrated-cover";
import type { InvitationDraft } from "@/lib/invitation-draft";
import type { InvitationDesign, ThemeId, TraditionId } from "@/types/invitation";
import { defaultMusic } from "@/data/music";
import type { AudioUploadContext } from "./custom-audio-upload";
import { MusicPicker } from "./music-picker";
import { InvitationDesignOptions } from "./invitation-options";
import { TraditionIcon, traditionSymbolLabel } from "@/components/tradition-symbol";

type PanelProps = { draft: InvitationDraft; change: (draft: InvitationDraft) => void };

export function OccasionPanel({ draft, change }: PanelProps) {
  const invitation = draft.invitation;
  const symbolLabel = traditionSymbolLabel(invitation.tradition);
  return <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>What brings you together?</h2><p>Wedding and engagement invitations are available now. More occasions are coming soon.</p></div>
    <div className="editor-occasion-grid" role="group" aria-label="Choose an occasion">{occasions.map((item, index) => <button type="button" key={item.id} disabled={!isOccasionAvailable(item.id)} aria-pressed={(invitation.occasion || "wedding") === item.id} onClick={() => change({ ...draft, themeId: getOccasionThemes(item.id)[0].id, invitation: applyOccasion(invitation, item.id) })}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong>{!isOccasionAvailable(item.id) && <ComingSoonBadge />}{(invitation.occasion || "wedding") === item.id && <Check size={15} />}</button>)}</div>
    <label className="form-field">Tradition or cultural style (optional)<select value={invitation.tradition || "neutral"} onChange={event => change({ ...draft, invitation: { ...invitation, tradition: event.target.value as TraditionId } })}>{traditions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Choose a tradition to add its symbol to your card. Neutral keeps the card without a religious symbol.</small></label>
    {symbolLabel && invitation.tradition && <label className="editor-toggle"><input type="checkbox" checked={invitation.design?.traditionSymbol !== false} onChange={event => change({ ...draft, invitation: { ...invitation, design: { ...getDesign(invitation), traditionSymbol: event.target.checked } } })} /><span><strong>Show tradition symbol</strong><small>{symbolLabel} at the top of your card. Your wording stays yours.</small></span><span className="editor-tradition-symbol" aria-hidden="true"><TraditionIcon tradition={invitation.tradition} /></span></label>}
    {invitation.tradition === "other" && <label className="form-field">Your tradition or style<input maxLength={100} value={invitation.traditionLabel || ""} onChange={event => change({ ...draft, invitation: { ...invitation, traditionLabel: event.target.value } })} /></label>}
    <p className="editor-help-note">Changing the occasion keeps your names, schedule, photos, and custom wording. Suggested copy updates only where you haven’t changed it.</p>
  </>;
}

export function DesignPanel({ draft, change, chooseTheme, ...uploadContext }: PanelProps & AudioUploadContext & { chooseTheme: (theme: ThemeId) => void }) {
  const design = getDesign(draft.invitation);
  const themes = getOccasionThemes(draft.invitation.occasion);
  const music = design.music || defaultMusic;
  function update(patch: Partial<InvitationDesign>) { change({ ...draft, invitation: { ...draft.invitation, design: { ...design, ...patch } } }); }
  function move(index: number, direction: number) { const order = [...design.sectionOrder]; const target = index + direction; if (target < 0 || target >= order.length) return; [order[index], order[target]] = [order[target], order[index]]; update({ sectionOrder: order }); }
  return <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>Find your kind of beautiful.</h2><p>{themes.length} complete designs for this occasion. Each has its own composition. Your words, photos, and schedule stay with you when you switch.</p></div>
    <div className="editor-theme-grid">{themes.map(item => <button type="button" key={item.id} aria-pressed={draft.themeId === item.id} aria-label={item.name} className="editor-theme-choice" onClick={() => chooseTheme(item.id)}><span className="editor-theme-art" aria-hidden="true">{!draft.invitation.occasion || draft.invitation.occasion === "wedding" ? <IllustratedCover theme={item.id} invitation={draft.invitation} compact /> : <InvitationArt theme={item.id} invitation={draft.invitation} compact />}{draft.themeId === item.id && <b><Check size={13} /></b>}</span><strong>{item.name}</strong><small>{item.family}</small></button>)}</div>
    <div className="editor-field-pair"><label className="form-field">Colour palette<select value={design.palette} onChange={event => update({ palette: event.target.value as InvitationDesign["palette"] })}><option value="original">Theme original</option><option value="rose">Rose & ivory</option><option value="sage">Sage & paper</option><option value="indigo">Indigo & pearl</option></select></label><label className="form-field">Typography<select value={design.typography} onChange={event => update({ typography: event.target.value as InvitationDesign["typography"] })}><option value="original">Theme original</option><option value="serif">Classic serif</option><option value="sans">Modern sans</option><option value="script">Soft calligraphy</option></select></label></div>
    <label className="form-field">Cover text<input maxLength={160} value={draft.invitation.coverText ?? ""} onChange={event => change({ ...draft, invitation: { ...draft.invitation, coverText: event.target.value } })} /><small>Leave blank for a quieter cover.</small></label>
    <label className="editor-toggle"><input type="checkbox" checked={design.decoration} onChange={event => update({ decoration: event.target.checked })} /><span><strong>Decorative artwork</strong><small>Original flowers, frames, and abstract motifs. Turn off for a simpler invitation.</small></span></label>
    <InvitationDesignOptions design={design} onChange={update} />
    {draft.invitation.occasion !== "remembrance" && <label className="editor-toggle"><input type="checkbox" checked={design.countdown} onChange={event => update({ countdown: event.target.checked })} /><span><strong>Show a countdown</strong><small>Count down to the event date you choose.</small></span></label>}
    <label className="form-field">Movement & transitions<select value={design.motion || "gentle"} onChange={event => update({ motion: event.target.value as InvitationDesign["motion"] })}><option value="gentle">Gentle · quiet, quick reveals</option><option value="expressive">Expressive · a little more theatre</option><option value="none">Still · no decorative animation</option></select><small>Your guests’ reduced-motion setting always takes priority.</small></label>
    <div className="editor-music"><label className="editor-toggle"><input type="checkbox" checked={draft.musicEnabled} onChange={event => change({ ...draft, musicEnabled: event.target.checked })} /><span><strong>A soundtrack for your story</strong><small>Guests choose when to listen. Nothing plays automatically.</small></span></label>
      {draft.musicEnabled && <MusicPicker {...uploadContext} music={music} change={value => update({ music: value })} />}
    </div>
    <div className="editor-section-order"><h3>Arrange your invitation</h3><p>Move sections up or down. Empty sections are hidden from guests.</p><ol>{design.sectionOrder.map((section, index) => <li key={section}><span>{sectionLabels[section]}</span><button type="button" aria-label={`Move ${sectionLabels[section]} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Move ${sectionLabels[section]} down`} disabled={index === design.sectionOrder.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button></li>)}</ol></div>
  </>;
}
