"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { applyOccasion, getDesign, occasions, sectionLabels, traditions } from "@/data/occasions";
import { getOccasionThemes } from "@/data/occasion-themes";
import { applyFestivalPreset, festivalPresets, getFestival } from "@/data/festivals";
import { InvitationArt } from "@/components/invitation-art";
import { IllustratedCover } from "@/components/wedding/illustrated-cover";
import type { InvitationDraft } from "@/lib/invitation-draft";
import type { FestivalPresetId, InvitationDesign, ThemeId, TraditionId } from "@/types/invitation";
import { defaultMusic } from "@/data/music";
import type { AudioUploadContext } from "./custom-audio-upload";
import { MusicPicker } from "./music-picker";
import { InvitationDesignOptions } from "./invitation-options";
import { TraditionIcon, traditionSymbolLabel } from "@/components/tradition-symbol";

type PanelProps = { draft: InvitationDraft; change: (draft: InvitationDraft) => void };

export function OccasionPanel({ draft, change }: PanelProps) {
  const invitation = draft.invitation;
  const symbolLabel = traditionSymbolLabel(invitation.tradition);
  const festival = getFestival(invitation);
  return <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>What brings you together?</h2><p>Choose your occasion, then make every detail your own.</p></div>
    <div className="editor-occasion-grid" role="group" aria-label="Choose an occasion">{occasions.map((item, index) => <button type="button" key={item.id} disabled={!isOccasionAvailable(item.id)} aria-pressed={(invitation.occasion || "wedding") === item.id} onClick={() => change({ ...draft, themeId: getOccasionThemes(item.id)[0].id, invitation: applyOccasion(invitation, item.id) })}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong>{!isOccasionAvailable(item.id) && <ComingSoonBadge />}{(invitation.occasion || "wedding") === item.id && <Check size={15} />}</button>)}</div>
    {invitation.occasion === "festival" && <div className="editor-festival-fields">
      <label className="form-field">Festival<select aria-label="Festival" value={festival.preset} onChange={event => change({ ...draft, invitation: applyFestivalPreset(invitation, event.target.value as FestivalPresetId) })}>{festivalPresets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Choose the artwork and suggested words for your celebration. Your date, schedule and tradition stay yours.</small></label>
      <label className="form-field">Celebration title<input aria-label="Celebration title" maxLength={100} value={festival.title} onChange={event => change({ ...draft, invitation: { ...invitation, festival: { ...festival, title: event.target.value } } })} placeholder="e.g. Diwali at our home" /><small>This is the main title on your invitation. Add your host or family name in Details.</small></label>
    </div>}
    <label className="form-field">Tradition or cultural style (optional)<select value={invitation.tradition || "neutral"} onChange={event => change({ ...draft, invitation: { ...invitation, tradition: event.target.value as TraditionId } })}>{traditions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Choose a tradition to add its symbol to your card. Neutral keeps the card without a religious symbol.</small></label>
    {symbolLabel && invitation.tradition && <label className="editor-toggle"><input type="checkbox" checked={invitation.design?.traditionSymbol !== false} onChange={event => change({ ...draft, invitation: { ...invitation, design: { ...getDesign(invitation), traditionSymbol: event.target.checked } } })} /><span><strong>Show tradition symbol</strong><small>{symbolLabel} at the top of your card. Your wording stays yours.</small></span><span className="editor-tradition-symbol" aria-hidden="true"><TraditionIcon tradition={invitation.tradition} /></span></label>}
    {invitation.tradition === "other" && <label className="form-field">Your tradition or style<input maxLength={100} value={invitation.traditionLabel || ""} onChange={event => change({ ...draft, invitation: { ...invitation, traditionLabel: event.target.value } })} /></label>}
    <p className="editor-help-note">Changing the occasion keeps your names, schedule, photos, and custom wording. Suggested copy updates only where you haven’t changed it.</p>
  </>;
}

const designTabs = ["Templates", "Colours & type", "Opening & motion", "Music & layout"] as const;

export function DesignPanel({ draft, change, chooseTheme, ...uploadContext }: PanelProps & AudioUploadContext & { chooseTheme: (theme: ThemeId) => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabId = useId();
  const design = getDesign(draft.invitation);
  const themes = getOccasionThemes(draft.invitation.occasion);
  const music = design.music || defaultMusic;
  function update(patch: Partial<InvitationDesign>) { change({ ...draft, invitation: { ...draft.invitation, design: { ...design, ...patch } } }); }
  function move(index: number, direction: number) { const order = [...design.sectionOrder]; const target = index + direction; if (target < 0 || target >= order.length) return; [order[index], order[target]] = [order[target], order[index]]; update({ sectionOrder: order }); }
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % designTabs.length : event.key === "ArrowLeft" ? (index + designTabs.length - 1) % designTabs.length : event.key === "Home" ? 0 : event.key === "End" ? designTabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActiveTab(next); tabRefs.current[next]?.focus();
  }
  return <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>Make it feel like you.</h2><p>Choose a design, then add the finishing touches.</p></div>
    <div className="editor-design-tabs" role="tablist" aria-label="Design settings">{designTabs.map((label, index) => <button key={label} ref={node => { tabRefs.current[index] = node; }} type="button" role="tab" id={`${tabId}-tab-${index}`} aria-controls={`${tabId}-panel-${index}`} aria-selected={activeTab === index} tabIndex={activeTab === index ? 0 : -1} onClick={() => setActiveTab(index)} onKeyDown={event => navigateTabs(event, index)}>{label}</button>)}</div>
    <div className="editor-design-panel" role="tabpanel" id={`${tabId}-panel-0`} aria-labelledby={`${tabId}-tab-0`} hidden={activeTab !== 0}>
      <div className="editor-theme-grid">{themes.map(item => <button type="button" key={item.id} aria-pressed={draft.themeId === item.id} aria-label={item.name} className="editor-theme-choice" onClick={() => chooseTheme(item.id)}><span className="editor-theme-art" aria-hidden="true">{!draft.invitation.occasion || draft.invitation.occasion === "wedding" ? <IllustratedCover theme={item.id} invitation={draft.invitation} compact /> : <InvitationArt theme={item.id} invitation={draft.invitation} compact />}{draft.themeId === item.id && <b><Check size={13} /></b>}</span><strong>{item.name}</strong></button>)}</div>
    </div>
    <div className="editor-design-panel" role="tabpanel" id={`${tabId}-panel-1`} aria-labelledby={`${tabId}-tab-1`} hidden={activeTab !== 1}>
      <div className="editor-field-pair"><label className="form-field">Colour palette<select value={design.palette} onChange={event => update({ palette: event.target.value as InvitationDesign["palette"] })}><option value="original">Theme original</option><option value="rose">Rose & ivory</option><option value="sage">Sage & paper</option><option value="indigo">Indigo & pearl</option></select></label><label className="form-field">Typography<select value={design.typography} onChange={event => update({ typography: event.target.value as InvitationDesign["typography"] })}><option value="original">Theme original</option><option value="serif">Classic serif</option><option value="sans">Modern sans</option><option value="script">Soft calligraphy</option></select></label></div>
      <label className="form-field">Cover text<input maxLength={160} value={draft.invitation.coverText ?? ""} onChange={event => change({ ...draft, invitation: { ...draft.invitation, coverText: event.target.value } })} /><small>Leave blank for a quieter cover.</small></label>
      <label className="editor-toggle"><input type="checkbox" checked={design.decoration} onChange={event => update({ decoration: event.target.checked })} /><span><strong>Decorative artwork</strong><small>Flowers, frames and motifs from your chosen design.</small></span></label>
      {draft.invitation.occasion !== "remembrance" && <label className="editor-toggle"><input type="checkbox" checked={design.countdown} onChange={event => update({ countdown: event.target.checked })} /><span><strong>Show a countdown</strong><small>Count down to the date you choose.</small></span></label>}
    </div>
    <div className="editor-design-panel" role="tabpanel" id={`${tabId}-panel-2`} aria-labelledby={`${tabId}-tab-2`} hidden={activeTab !== 2}>
      <InvitationDesignOptions design={design} onChange={update} />
      <label className="form-field">Movement & transitions<select value={design.motion || "gentle"} onChange={event => update({ motion: event.target.value as InvitationDesign["motion"] })}><option value="gentle">Gentle · quiet, quick reveals</option><option value="expressive">Expressive · a little more theatre</option><option value="none">Still · no decorative animation</option></select><small>Your guests’ reduced-motion setting always takes priority.</small></label>
    </div>
    <div className="editor-design-panel" role="tabpanel" id={`${tabId}-panel-3`} aria-labelledby={`${tabId}-tab-3`} hidden={activeTab !== 3}>
      <div className="editor-music"><label className="editor-toggle"><input type="checkbox" checked={draft.musicEnabled} onChange={event => change({ ...draft, musicEnabled: event.target.checked })} /><span><strong>A soundtrack for your story</strong><small>Guests can play or pause the music.</small></span></label>{draft.musicEnabled && <MusicPicker {...uploadContext} music={music} change={value => update({ music: value })} />}</div>
      <div className="editor-section-order"><h3>Arrange your invitation</h3><p>Move sections up or down. Empty sections stay hidden.</p><ol>{design.sectionOrder.map((section, index) => <li key={section}><span>{sectionLabels[section]}</span><button type="button" aria-label={`Move ${sectionLabels[section]} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Move ${sectionLabels[section]} down`} disabled={index === design.sectionOrder.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button></li>)}</ol></div>
    </div>
  </>;
}
