/** Keep multipart photo requests below Vercel's 4.5 MB function limit. */
export const PHOTO_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const PHOTO_UPLOAD_MAX_LABEL = "4 MB";
export const PHOTO_UPLOAD_ERROR = `Choose a JPG, PNG, or WebP photo up to ${PHOTO_UPLOAD_MAX_LABEL}.`;
