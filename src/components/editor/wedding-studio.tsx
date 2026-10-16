"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { sectionLabels } from "@/data/occasions";
import { hasIndicText } from "@/lib/invitation-text";
import { sameWeddingLook, weddingJourneys, weddingLooks, weddingLookSettings, type WeddingLook } from "@/data/wedding-studio";
import type { Invitation, InvitationDesign } from "@/types/invitation";
import styles from "./wedding-studio.module.css";

export function WeddingStyleStudio({ invitation, design, onChange }: { invitation: Invitation; design: InvitationDesign; onChange: (patch: Partial<InvitationDesign>) => void }) {
  const [previous, setPrevious] = useState<{ before: WeddingLook; applied: WeddingLook } | null>(null);
  const [notice, setNotice] = useState("");
  const current = weddingLookSettings(design);
  const canUndo = previous && sameWeddingLook(current, previous.applied);
  const names = invitation.couple.filter(Boolean).join(" & ") || "Your names";
  return <section className={styles.studio} aria-labelledby="wedding-style-title">
    <span className={styles.eyebrow}>YOUR WEDDING, YOUR WAY</span>
    <h3 id="wedding-style-title">Find a feeling. Make it yours.</h3>
    <p>Try a colour, type and motion pairing on your chosen template. Fine-tune any detail below.</p>
    <div className={styles.looks} role="group" aria-label="Wedding style pairings">
      {weddingLooks.map(look => {
        const active = sameWeddingLook(current, look.settings);
        return <button type="button" key={look.id} aria-pressed={active} aria-label={`Apply ${look.name}`} className={styles.look} onClick={() => {
          if (active) return;
          setPrevious({ before: current, applied: look.settings });
          onChange(look.settings);
          setNotice(`${look.name} applied. Your names, photos, events and opening line stay yours.`);
        }}>
          <span className={styles.sample} data-font={look.settings.typography} data-artwork={look.settings.decoration} style={{ "--sample-ink": look.colours[0], "--sample-paper": look.colours[1] } as CSSProperties} aria-hidden="true"><span className={styles.sampleCaption}>A LITTLE FOREVER</span><span className={styles.sampleNames} data-indic={hasIndicText(names) || undefined}>{invitation.couple.some(Boolean) ? invitation.couple.filter(Boolean).map((name, index) => <span key={index}>{index > 0 && <em>&</em>}{name}</span>) : "Your names"}</span><span className={styles.sampleRule} /><span className={styles.sampleCaption}>TOGETHER WITH YOU</span></span>
          <span className={styles.lookTitle}>{look.name}<span className={styles.selection} aria-hidden="true">{active ? <Check size={15} /> : <ArrowRight size={15} />}</span></span>
          <span className={styles.swatches} aria-hidden="true">{look.colours.map(colour => <i key={colour} style={{ background: colour }} />)}</span>
          <span className={styles.description}>{look.description}</span>
        </button>;
      })}
    </div>
    <div className={styles.feedback}><p role="status" aria-live="polite">{notice || "Pairings style the invitation after your maroon envelope opens."}</p>{canUndo && <button type="button" onClick={() => { onChange(previous.before); setPrevious(null); setNotice("Your previous style is restored."); }}><RotateCcw size={14} /> Undo style</button>}</div>
  </section>;
}

export function WeddingJourneyStudio({ design, onChange }: { design: InvitationDesign; onChange: (patch: Partial<InvitationDesign>) => void }) {
  const [previous, setPrevious] = useState<{ before: InvitationDesign["sectionOrder"]; applied: string } | null>(null);
  const [notice, setNotice] = useState("");
  const order = design.sectionOrder.join(",");
  return <section className={styles.journey} aria-labelledby="wedding-journey-title">
    <span className={styles.eyebrow}>THROUGH YOUR GUESTS’ EYES</span><h3 id="wedding-journey-title">What should they discover first?</h3><p>Your envelope and cover open the invitation. Choose what follows, or arrange each section below.</p>
    <div className={styles.journeyChoices} role="group" aria-label="Wedding guest journey">{weddingJourneys.map(item => <button key={item.id} type="button" aria-pressed={order === item.order.join(",")} onClick={() => {
      if (order === item.order.join(",")) return;
      setPrevious({ before: [...design.sectionOrder], applied: item.order.join(",") });
      onChange({ sectionOrder: [...item.order] });
      setNotice(`${item.name} selected. Your ceremony dates and times stay unchanged.`);
    }}><span>{item.name}{order === item.order.join(",") && <Check size={16} aria-hidden="true" />}</span><small>{item.description}</small></button>)}</div>
    <ol className={styles.route} aria-label="Your invitation reading order"><li>Envelope & cover</li>{design.sectionOrder.map(section => <li key={section}>{sectionLabels[section]}{section === "rsvp" && design.rsvp === false && <small> · hidden</small>}</li>)}</ol>
    <div className={styles.feedback}><p role="status" aria-live="polite">{notice || "Sections without content stay hidden. Ceremony times are always chronological."}</p>{previous && previous.applied === order && <button type="button" onClick={() => { onChange({ sectionOrder: previous.before }); setPrevious(null); setNotice("Your previous reading order is restored."); }}><RotateCcw size={14} /> Undo order</button>}</div>
  </section>;
}
