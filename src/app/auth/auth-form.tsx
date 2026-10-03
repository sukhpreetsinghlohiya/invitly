"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { authenticate, type AuthMode, type AuthState } from "./actions";
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
      <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} aria-describedby={confirm ? undefined : "password-hint"} readOnly={readOnly} value={value} onChange={(event) => onChange(event.target.value)} />
      <button className={styles.visibilityButton} type="button" aria-controls={id} aria-label={`${visible ? "Hide" : "Show"} ${confirm ? "confirmed password" : "password"}`} aria-pressed={visible} onMouseDown={(event) => event.preventDefault()} onClick={() => setVisible((shown) => !shown)}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
    {!confirm && <small id="password-hint" className={styles.hint}>Use 8–128 characters.</small>}
  </div>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const submissionLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
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
  const busy = pending || submitting;
  const label = { login: "Sign in", signup: "Create my account", forgot: "Send reset link", reset: "Save new password" }[mode];
  const pendingLabel = { login: "Signing in…", signup: "Creating your account…", forgot: "Sending reset link…", reset: "Saving your password…" }[mode];

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

  return <form className={styles.form} action={action} aria-busy={busy} onSubmit={(event) => {
    if (submissionLock.current || busy || remaining > 0) {
      event.preventDefault();
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
  }}>
    {mode === "signup" && <label className="form-field" htmlFor="name">Your name<input id="name" name="name" required maxLength={120} autoComplete="name" readOnly={busy} value={name} onChange={(event) => setName(event.target.value)} /></label>}
    {mode !== "reset" && <label className="form-field" htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} readOnly={busy} value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
    {mode !== "forgot" && <PasswordField mode={mode} readOnly={busy} value={password} onChange={setPassword} />}
    {(mode === "signup" || mode === "reset") && <PasswordField confirm mode={mode} readOnly={busy} value={confirmation} onChange={setConfirmation} />}
    <button className={`button ${styles.submit}`} type="submit" disabled={busy || remaining > 0} aria-describedby={remaining > 0 ? "auth-cooldown" : undefined}>
      {busy && <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />}
      {busy ? pendingLabel : remaining > 0 ? `Try again in ${remaining}s` : mode === "forgot" && state.success ? "Send another reset link" : label}
    </button>
    {remaining > 0 && <p id="auth-cooldown" className={styles.cooldown}>Please wait {remaining} seconds before another request.</p>}
    <div className={styles.feedback}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
    </div>
  </form>;
}
