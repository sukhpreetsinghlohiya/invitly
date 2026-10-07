"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { confirmEmail, type AuthState } from "../actions";

export function ConfirmForm({ tokenHash, type, label }: { tokenHash: string; type: string; label: string }) {
  const submissionLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [state, action, pending] = useActionState<AuthState, FormData>(async (previous, formData) => {
    try {
      const result = await confirmEmail(previous, formData);
      setRemaining(result.retryAfter ?? 0);
      return result;
    }
    catch (error) { unstable_rethrow(error); return { error: "We couldn’t verify this link. Please try again." }; }
    finally { submissionLock.current = false; setSubmitting(false); }
  }, {});
  useEffect(() => {
    if (!state.notBefore) return;
    const deadline = state.notBefore;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.notBefore]);
  const busy = pending || submitting;
  return <form action={action} aria-label="Verify email link" aria-busy={busy} onSubmit={(event) => {
    if (submissionLock.current || busy || remaining > 0) { event.preventDefault(); return; }
    submissionLock.current = true;
    setSubmitting(true);
  }}>
    <input type="hidden" name="token_hash" value={tokenHash} /><input type="hidden" name="type" value={type} />
    <button className="button" type="submit" disabled={busy || remaining > 0} aria-describedby={remaining > 0 ? "confirmation-cooldown" : undefined}>{busy ? "Verifying…" : remaining > 0 ? `Try again in ${remaining}s` : label}</button>
    {remaining > 0 && <p id="confirmation-cooldown">Please wait {remaining} seconds before trying this link again.</p>}
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
  </form>;
}
