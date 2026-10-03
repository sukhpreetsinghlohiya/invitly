"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import styles from "./feedback.module.css";

type ToastOptions = { title: string; description?: string; tone?: "success" | "info" };
type ToastMessage = ToastOptions & { id: string };
const toastEvent = "invitly:toast";

/** Feedback never replaces durable inline errors or the result of an action. */
export function toast(options: ToastOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastMessage>(toastEvent, { detail: { ...options, id: crypto.randomUUID() } }));
}

function ToastItem({ message, dismiss }: { message: ToastMessage; dismiss: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (hovered || focused) return;
    const timer = window.setTimeout(() => dismiss(message.id), 6000);
    return () => window.clearTimeout(timer);
  }, [dismiss, message.id, hovered, focused]);
  return <li className={styles.toast} data-tone={message.tone || "success"} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <span className={styles.toastIcon} aria-hidden="true">{message.tone === "info" ? <Info size={20} /> : <CheckCircle2 size={20} />}</span>
    <div role="status" aria-atomic="true"><strong>{message.title}</strong>{message.description && <p>{message.description}</p>}</div>
    <button type="button" className={styles.dismiss} aria-label={`Dismiss ${message.title}`} onClick={() => dismiss(message.id)}><X size={17} aria-hidden="true" /></button>
  </li>;
}

/** Mount once, outside page content, so saved/copied feedback remains visible. */
export function ToastViewport() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const dismiss = useCallback((id: string) => setMessages(current => current.filter(message => message.id !== id)), []);
  useEffect(() => {
    function receive(event: Event) {
      const message = (event as CustomEvent<ToastMessage>).detail;
      setMessages(current => [...current.filter(item => item.title !== message.title), message].slice(-3));
    }
    window.addEventListener(toastEvent, receive);
    return () => window.removeEventListener(toastEvent, receive);
  }, []);
  return <ol className={styles.viewport} aria-label="Notifications">{messages.map(message => <ToastItem key={message.id} message={message} dismiss={dismiss} />)}</ol>;
}

type ConfirmOptions = { title: string; description: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };

/** Browser-managed modal focus with an explicit safe default and Escape cancellation. */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const finish = useCallback((accepted: boolean) => {
    const resolve = resolveRef.current;
    if (!resolve) return;
    resolveRef.current = null;
    dialogRef.current?.close();
    setRequest(null);
    const trigger = returnFocus.current;
    queueMicrotask(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
    resolve(accepted);
  }, []);
  const confirm = useCallback((options: ConfirmOptions) => {
    // A second click must not create a second destructive request.
    if (resolveRef.current) return Promise.resolve(false);
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return new Promise<boolean>(resolve => { resolveRef.current = resolve; setRequest(options); });
  }, []);
  useEffect(() => {
    if (!request) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    cancelRef.current?.focus({ preventScroll: true });
  }, [request]);
  useEffect(() => () => { resolveRef.current?.(false); resolveRef.current = null; }, []);
  const confirmationDialog = <dialog className={styles.confirm} ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); finish(false); }} onClose={() => finish(false)}>
    {request && <><span className={styles.confirmEyebrow}>A QUICK CHECK</span><h2 id={titleId}>{request.title}</h2><p id={descriptionId}>{request.description}</p><div className={styles.confirmActions}><button ref={cancelRef} type="button" className="button button-secondary" onClick={() => finish(false)}>{request.cancelLabel || "Cancel"}</button><button type="button" className={`button ${request.destructive !== false ? styles.danger : ""}`} onClick={() => finish(true)}>{request.confirmLabel || "Remove"}</button></div></>}
  </dialog>;
  return { confirm, confirmationDialog };
}

export function BusyIndicator() { return <span className={styles.spinner} aria-hidden="true" />; }
