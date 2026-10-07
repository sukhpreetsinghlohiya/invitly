/** Keep multipart photo requests below Vercel's 4.5 MB function limit. */
export const PHOTO_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const PHOTO_UPLOAD_MAX_LABEL = "4 MB";
export const PHOTO_UPLOAD_ERROR = `Choose a JPG, PNG, or WebP photo up to ${PHOTO_UPLOAD_MAX_LABEL}.`;
export const PHOTO_LIMIT_ERROR = "Use up to 12 photos. Remove one before uploading another.";

export function isPhotoLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const problem = error as { code?: unknown; message?: unknown };
  return problem.code === "P0001" && problem.message === "EVENT_PHOTO_LIMIT_REACHED";
}
