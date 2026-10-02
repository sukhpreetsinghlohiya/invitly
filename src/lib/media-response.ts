import "server-only";
import sharp from "sharp";

export async function mediaResponse(data: Blob, request: Request, contentType: string) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Type": contentType };
  const width = new URL(request.url).searchParams.get("w");
  if (!width) return new Response(data, { headers });
  if (!["320", "640", "960", "1600"].includes(width)) return new Response(null, { status: 400, headers });
  const resized = await sharp(Buffer.from(await data.arrayBuffer())).resize({ width: Number(width), withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  return new Response(new Uint8Array(resized), { headers: { ...headers, "Content-Type": "image/webp" } });
}
