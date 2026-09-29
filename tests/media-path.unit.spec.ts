import { expect, test } from "@playwright/test";
import { safePublishedMedia } from "../src/lib/media-path";

const eventId = "f4000000-0000-4000-a000-000000000001";
const otherEventId = "f4000000-0000-4000-a000-000000000002";
const record = { event_id: eventId, storage_path: `${eventId}/photo.webp`, mime_type: "image/webp" };

test("published media permits only canonical event-bound image objects", () => {
  expect(safePublishedMedia(record)).toEqual({ storagePath: record.storage_path, contentType: "image/webp" });
  for (const [extension, mime] of [["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]) {
    expect(safePublishedMedia({ ...record, storage_path: `${eventId}/a123-456_file.${extension}`, mime_type: mime })).not.toBeNull();
  }
});

test("published media blocks literal and encoded traversal before privileged download", () => {
  for (const path of [
    `${eventId}/../${otherEventId}/photo.webp`, `${eventId}/%2e%2e/${otherEventId}/photo.webp`,
    `${eventId}/%252e%252e/${otherEventId}/photo.webp`, `${eventId}/..\\${otherEventId}\\photo.webp`,
    `${eventId}//photo.webp`, `${eventId}/./photo.webp`, `${eventId}/folder/photo.webp`,
    `${otherEventId}/photo.webp`, `/${eventId}/photo.webp`, `${eventId}/photo.webp?download=1`,
    `${eventId}/photo.webp#fragment`, `${eventId}/photo%2f.webp`, `${eventId}/photo.webp\u0000`,
  ]) expect(safePublishedMedia({ ...record, storage_path: path }), path).toBeNull();
});

test("published media rejects unsafe or mismatched content types and malformed metadata", () => {
  for (const mime_type of ["text/html", "image/svg+xml", "image/png", "image/webp\r\nX-Evil: true", "IMAGE/WEBP"]) expect(safePublishedMedia({ ...record, mime_type })).toBeNull();
  for (const value of [null, [], "object", {}, { ...record, event_id: "invalid" }, { ...record, storage_path: 3 }]) expect(safePublishedMedia(value)).toBeNull();
});
