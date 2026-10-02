/** Private, publication-checked byte ranges also support iOS audio playback. */
export function audioResponse(data: Blob, request: Request) {
  const headers: Record<string, string> = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes" };
  const range = request.headers.get("range");
  if (!range) return new Response(data, { headers: { ...headers, "Content-Length": String(data.size) } });
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid = () => new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${data.size}` } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, data.size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), data.size - 1) : data.size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= data.size || end < start) return invalid();
  return new Response(data.slice(start, end + 1), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.size}`, "Content-Length": String(end - start + 1) } });
}
