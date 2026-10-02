import { parseBuffer } from "music-metadata";
import { MAX_AUDIO_BYTES } from "./audio";

export async function validateMp3(data: Blob) {
  if (!data.size || data.size > MAX_AUDIO_BYTES) throw new Error("Choose an MP3 up to 10 MB.");
  try {
    const { format } = await parseBuffer(new Uint8Array(await data.arrayBuffer()), { mimeType: "audio/mpeg", size: data.size }, { duration: true, skipCovers: true });
    if (format.container !== "MPEG" || !format.codec?.includes("Layer 3") || !format.duration || !Number.isFinite(format.duration) || format.duration > 900) throw new Error("unsupported");
    return { duration: format.duration };
  } catch { throw new Error("Choose a readable MP3 song or recording up to 15 minutes long."); }
}
