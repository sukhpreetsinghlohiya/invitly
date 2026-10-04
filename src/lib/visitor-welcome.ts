export type VisitorIntroduction = {
  submissionId: string;
  name: string;
  reason: string;
  page: string;
  referrer: string | null;
};

// Only marketing pages participate. Guest tokens, invitation slugs, editor
// contents, auth links and query strings must never enter this workflow.
export function isWelcomePage(path: string) {
  return ["/", "/templates", "/blog"].includes(path)
    || /^\/blog\/(?:category\/)?[a-z0-9-]+$/.test(path);
}

export function referringSite(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.hostname : null;
  } catch { return null; }
}

export function validateVisitorIntroduction(value: unknown): VisitorIntroduction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.submissionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submissionId)) return null;
  if (typeof input.name !== "string" || typeof input.reason !== "string" || typeof input.page !== "string") return null;
  const name = input.name.trim().replace(/\s+/g, " ");
  const reason = input.reason.trim();
  if (!name || name.length > 80 || !reason || reason.length > 500 || /[\u0000-\u001f\u007f]/.test(name) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(reason)) return null;
  if (!isWelcomePage(input.page)) return null;
  return { submissionId: input.submissionId, name, reason, page: input.page, referrer: referringSite(input.referrer) };
}
