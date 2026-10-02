import { createClient } from "@/lib/supabase/server";
import { createMediaServiceClient } from "@/lib/supabase/media-server";
import { isUuid } from "@/lib/host-event";
import { EVENT_AUDIO_BUCKET, selectedUploadedAudio, uploadedAudioPath } from "@/lib/audio";
import { audioResponse } from "@/lib/audio-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string; audioId: string }> }) {
  const { eventId, audioId } = await params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  if (!isUuid(eventId) || !isUuid(audioId)) return missing();
  try {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    const { data: ownEvent } = user ? await client.from("events").select("id").eq("id", eventId).eq("owner_id", user.id).maybeSingle() : { data: null };
    const service = createMediaServiceClient();
    if (!ownEvent) {
      const { data: event } = await service.from("events").select("invitation_content").eq("id", eventId).eq("is_published", true).eq("music_enabled", true).maybeSingle();
      const selected = selectedUploadedAudio(event?.invitation_content);
      if (!selected || selected.eventId !== eventId.toLowerCase() || selected.id !== audioId.toLowerCase()) return missing();
    }
    const { data, error } = await service.storage.from(EVENT_AUDIO_BUCKET).download(uploadedAudioPath({ eventId: eventId.toLowerCase(), id: audioId.toLowerCase() }));
    if (error || !data) return missing();
    return audioResponse(data, request);
  } catch { return missing(); }
}
