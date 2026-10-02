"use client";

import { useId, useState } from "react";
import { getWordingPreset, wordingLanguages, type WordingLanguage, type WordingPatch } from "@/data/invitation-wording";
import type { Invitation } from "@/types/invitation";

const fields = [
  ["coverText", "Cover"], ["intro", "Opening"], ["message", "Message"], ["closingText", "Closing"],
] as const;

export function WordingPanel({ invitation, onApply }: { invitation: Invitation; onApply: (patch: Pick<Invitation, "coverText" | "intro" | "message" | "closingText">) => void }) {
  const selectId = useId();
  const noteId = useId();
  const [language, setLanguage] = useState<WordingLanguage>(() => wordingLanguages.find(item => {
    const preset = getWordingPreset(invitation.occasion, item.id);
    return fields.every(([field]) => invitation[field] === preset[field]);
  })?.id ?? "english");
  const [lastApplied, setLastApplied] = useState<WordingPatch | null>(null);
  const wording = getWordingPreset(invitation.occasion, language);
  const selected = wordingLanguages.find(item => item.id === language)!;
  const applied = lastApplied && fields.every(([field]) => invitation[field] === lastApplied[field] && wording[field] === lastApplied[field]);

  return <details className="editor-wording-panel">
    <summary><span><strong>Say it your way</strong><small>English, Hinglish, or words that feel like home.</small></span><span className="editor-wording-chevron" aria-hidden="true">⌄</span></summary>
    <div className="editor-wording-content">
      <label className="form-field" htmlFor={selectId}>Wording language<select id={selectId} value={language} onChange={event => setLanguage(event.target.value as WordingLanguage)}>{wordingLanguages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <p className="editor-wording-intro">A starting point for your invitation. Preview the lines, then make them yours.</p>
      <dl className="editor-wording-preview" aria-label={`${selected.label} wording preview`} data-wording-language={language}>{fields.map(([field, label]) => <div key={field}><dt lang="en">{label}</dt><dd lang={selected.locale} data-wording-field={field}>{wording[field]}</dd></div>)}</dl>
      <p className="editor-wording-note" id={noteId}>Replaces cover, opening, message and closing. You can edit every line.</p>
      <div className="editor-wording-actions"><button type="button" className="button button-secondary" aria-describedby={noteId} onClick={() => { onApply(wording); setLastApplied(wording); }}>Use this wording</button><p className="editor-wording-status" role="status">{applied ? "Wording added. Edit any line below or in Design." : "Your invitation changes only when you apply."}</p></div>
    </div>
  </details>;
}
