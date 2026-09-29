"use client";

import { useActionState } from "react";
import { authenticate, type AuthMode, type AuthState } from "./actions";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate.bind(null, mode), {});
  const label = { login: "Sign in", signup: "Create my account", forgot: "Send reset link", reset: "Save new password" }[mode];
  return <form action={action}>
    {mode === "signup" && <label className="form-field" htmlFor="name">Your name<input id="name" name="name" required maxLength={120} autoComplete="name" /></label>}
    {mode !== "reset" && <label className="form-field" htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label>}
    {mode !== "forgot" && <label className="form-field" htmlFor="password">{mode === "reset" ? "New password" : "Password"}<input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} aria-describedby="password-hint" /><small id="password-hint">Use 8–128 characters.</small></label>}
    {(mode === "signup" || mode === "reset") && <label className="form-field" htmlFor="confirmPassword">Confirm password<input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>}
    <button className="button" type="submit" disabled={pending}>{pending ? "One moment…" : label}</button>
    <div aria-live="polite" aria-atomic="true">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div>
  </form>;
}
