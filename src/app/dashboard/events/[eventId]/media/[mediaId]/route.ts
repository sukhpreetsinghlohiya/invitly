import { requireHostEvent, isUuid } from "@/lib/host-event";
import { EVENT_MEDIA_BUCKET } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string; mediaId: string }> }) {
  const { eventId, mediaId } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!isUuid(mediaId)) return new Response(null, { status: 404, headers });
  try {
    const { client } = await requireHostEvent(eventId);
    const { data: photo } = await client.from("media").select("storage_path,mime_type").eq("id", mediaId).eq("event_id", eventId).maybeSingle();
    if (!photo) return new Response(null, { status: 404, headers });
    const { data, error } = await client.storage.from(EVENT_MEDIA_BUCKET).download(photo.storage_path);
    if (error || !data) return new Response(null, { status: 404, headers });
    return new Response(data, { headers: { ...headers, "Content-Type": photo.mime_type } });
  } catch { return new Response(null, { status: 404, headers }); }
}
