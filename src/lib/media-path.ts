const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const filename = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}\.(jpg|jpeg|png|webp)$/;
const mimeByExtension: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Metadata is host-writable. Never pass it to a privileged Storage client
 * until the complete path is canonical and bound to that same event UUID. */
export function safePublishedMedia(value: unknown): { storagePath: string; contentType: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.event_id !== "string" || !uuid.test(data.event_id) || typeof data.storage_path !== "string") return null;
  const parts = data.storage_path.split("/");
  if (parts.length !== 2 || parts[0] !== data.event_id) return null;
  const match = filename.exec(parts[1]);
  if (!match || data.mime_type !== mimeByExtension[match[1]]) return null;
  return { storagePath: data.storage_path, contentType: mimeByExtension[match[1]] };
}
