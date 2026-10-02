import { mediaResponse } from "@/lib/media-response";
import { isUuid } from "@/lib/host-event";
import { createPublicClient } from "@/lib/supabase/public";
import { EVENT_MEDIA_BUCKET } from "@/lib/supabase/storage";
import { createMediaServiceClient } from "@/lib/supabase/media-server";
import { safePublishedMedia } from "@/lib/media-path";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!isUuid(mediaId)) return new Response(null, { status: 404, headers });
  try {
    const client = createPublicClient();
    const { data: result, error } = await client.rpc("get_published_media", { p_media_id: mediaId });
    const photo = safePublishedMedia(result);
    if (error || !photo) return new Response(null, { status: 404, headers });
    const { data, error: downloadError } = await createMediaServiceClient().storage.from(EVENT_MEDIA_BUCKET).download(photo.storagePath);
    if (downloadError || !data) return new Response(null, { status: 404, headers });
    return mediaResponse(data, request, photo.contentType);
  } catch { return new Response(null, { status: 404, headers }); }
}
