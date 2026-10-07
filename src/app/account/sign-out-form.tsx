"use client";
import { useActionState, useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { signOut } from "./actions";

export function SignOutForm() {
  const submissionLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [state, action, pending] = useActionState(async () => {
    try { return await signOut(); }
    catch (error) { unstable_rethrow(error); return { error: "We couldn’t reach the account service. Check your connection and try signing out again." }; }
    finally { submissionLock.current = false; setSubmitting(false); }
  }, {});
  const busy = pending || submitting;
  return <form action={action} aria-label="Sign out" aria-busy={busy} onSubmit={(event) => {
    if (submissionLock.current || busy) { event.preventDefault(); return; }
    submissionLock.current = true;
    setSubmitting(true);
  }}><button className="button button-secondary" type="submit" disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>{state.error && <p className="form-error" role="alert">{state.error}</p>}</form>;
}
