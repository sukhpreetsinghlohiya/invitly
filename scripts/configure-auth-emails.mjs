import { readFile } from "node:fs/promises";

const projectRef = process.argv.find(argument => argument.startsWith("--project-ref="))?.split("=")[1];
if (!projectRef || !/^[a-z]{20}$/.test(projectRef)) throw new Error("Provide --project-ref=<your Supabase project reference>.");
const templates = {
  confirmation: "Confirm your email · Invitly",
  recovery: "Reset your password · Invitly",
  invite: "You’re invited to Invitly",
};
const payload = {};
for (const [name, subject] of Object.entries(templates)) {
  payload[`mailer_subjects_${name}`] = subject;
  payload[`mailer_templates_${name}_content`] = await readFile(new URL(`../supabase/templates/${name}.html`, import.meta.url), "utf8");
}
if (!process.argv.includes("--apply")) {
  console.log(`Ready for project ${projectRef}: ${Object.keys(templates).join(", ")}.`);
  console.log("Dry run only. Deploy /auth/confirm first, then use --apply with SUPABASE_ACCESS_TOKEN set securely.");
  process.exit(0);
}
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Set a scoped SUPABASE_ACCESS_TOKEN with auth configuration permissions. A project secret key cannot update hosted templates.");
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const response = await fetch(endpoint, { method: "PATCH", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(20_000) });
if (!response.ok) throw new Error(`Template update failed (HTTP ${response.status}). Check project access and token permissions.`);
const check = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20_000) });
if (!check.ok) throw new Error(`Template verification failed (HTTP ${check.status}).`);
const current = await check.json();
if (Object.entries(payload).some(([key, value]) => current[key] !== value)) throw new Error("Hosted template values did not match; review the project's Email Templates settings.");
console.log(`Verified all three Invitly email templates on ${projectRef}.`);
