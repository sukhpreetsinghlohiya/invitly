"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { authenticate, signInWithGoogle, type AuthMode, type AuthState } from "./actions";
import styles from "./auth-form.module.css";

function PasswordField({ confirm = false, mode, readOnly, value, onChange }: {
  confirm?: boolean;
  mode: AuthMode;
  readOnly: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const id = confirm ? "confirmPassword" : "password";
  const label = confirm ? "Confirm password" : mode === "reset" ? "New password" : "Password";
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className={styles.passwordField}>
      <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 8} maxLength={128} aria-describedby={confirm || mode === "login" ? undefined : "password-hint"} readOnly={readOnly} value={value} onChange={(event) => onChange(event.target.value)} />
      <button className={styles.visibilityButton} type="button" aria-controls={id} aria-label={`${visible ? "Hide" : "Show"} ${confirm ? "confirmed password" : "password"}`} aria-pressed={visible} onMouseDown={(event) => event.preventDefault()} onClick={() => setVisible((shown) => !shown)}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
    {!confirm && mode !== "login" && <small id="password-hint" className={styles.hint}>Use 8–128 characters. A longer phrase works well.</small>}
  </div>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const submissionLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState<AuthState, FormData>(async (previous, data) => {
    try {
      const result = await authenticate(mode, previous, data);
      setRemaining(result.retryAfter ?? 0);
      return result;
    } catch (error) {
      unstable_rethrow(error);
      setRemaining(0);
      return { error: "We couldn’t reach the account service. Check your connection and try again." };
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }, {});
  const [googleState, googleAction, googlePending] = useActionState<AuthState, FormData>(async () => {
    try { return await signInWithGoogle(); }
    catch (error) { unstable_rethrow(error); return { error: "We couldn’t start Google sign-in. Please try again." }; }
    finally { submissionLock.current = false; setGoogleSubmitting(false); }
  }, {});
  const googleBusy = googlePending || googleSubmitting;
  const busy = pending || submitting || googleBusy;
  const emailOnly = mode === "forgot" || mode === "resend";
  const label = { login: "Sign in", signup: "Create my account", forgot: "Send reset link", reset: "Save new password", resend: "Send confirmation email" }[mode];
  const pendingLabel = { login: "Signing in…", signup: "Creating your account…", forgot: "Sending reset link…", reset: "Saving your password…", resend: "Sending confirmation…" }[mode];

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

  return <>
    {(mode === "login" || mode === "signup") && <><form action={googleAction} aria-label="Google sign-in" aria-busy={googleBusy} onSubmit={(event) => {
      if (submissionLock.current || busy) { event.preventDefault(); return; }
      submissionLock.current = true;
      setGoogleSubmitting(true);
    }}>
      <button className={styles.googleButton} type="submit" disabled={busy}>
        {googleBusy ? <LoaderCircle className={styles.spinner} size={20} aria-hidden="true" /> : <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.04 46.98 31.87 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>}
        {googleBusy ? "Connecting to Google…" : "Continue with Google"}
      </button>
      {googleState.error && <p className="form-error" role="alert">{googleState.error}</p>}
    </form><div className={styles.divider}><span>or continue with email</span></div></>}
    <form className={styles.form} action={action} aria-label={label} aria-busy={busy} onSubmit={(event) => {
    if (submissionLock.current || busy || remaining > 0) {
      event.preventDefault();
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
  }}>
    {mode === "signup" && <label className="form-field" htmlFor="name">Your name<input id="name" name="name" required maxLength={120} autoComplete="name" readOnly={busy} value={name} onChange={(event) => setName(event.target.value)} /></label>}
    {mode !== "reset" && <label className="form-field" htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} readOnly={busy} value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
    {!emailOnly && <PasswordField mode={mode} readOnly={busy} value={password} onChange={setPassword} />}
    {(mode === "signup" || mode === "reset") && <PasswordField confirm mode={mode} readOnly={busy} value={confirmation} onChange={setConfirmation} />}
    <button className={`button ${styles.submit}`} type="submit" disabled={busy || remaining > 0} aria-describedby={remaining > 0 ? "auth-cooldown" : undefined}>
      {busy && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
      {pending || submitting ? pendingLabel : remaining > 0 ? `Try again in ${remaining}s` : mode === "forgot" && state.success ? "Send another reset link" : label}
    </button>
    {remaining > 0 && <p id="auth-cooldown" className={styles.cooldown}>Please wait {remaining} seconds before another request.</p>}
    <div className={styles.feedback}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      {state.confirmationRequired && <p><Link href="/resend-confirmation">Send a fresh confirmation email</Link></p>}
    </div>
  </form></>;
}
