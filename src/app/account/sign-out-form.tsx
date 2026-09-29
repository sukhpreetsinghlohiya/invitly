"use client";
import { useActionState } from "react";
import { signOut } from "./actions";

export function SignOutForm() {
  const [state, action, pending] = useActionState(signOut, {});
  return <form action={action}><button className="button button-secondary" type="submit" disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button>{state.error && <p className="form-error" role="alert">{state.error}</p>}</form>;
}
