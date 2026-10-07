import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as crypto from "node:crypto";
import ts from "typescript";
import { expect, test } from "@playwright/test";
import { safePublishedMedia } from "../src/lib/media-path";
import * as audio from "../src/lib/audio";
import * as guestValidation from "../src/lib/guest-validation";
import * as photoUpload from "../src/lib/photo-upload";
import type { GuestRsvpState } from "../src/app/g/[token]/actions";

const eventId = "aaaaaaaa-1111-4111-a111-aaaaaaaaaaaa";
const mediaId = "bbbbbbbb-1111-4111-a111-bbbbbbbbbbbb";
const otherId = "cccccccc-1111-4111-a111-cccccccccccc";
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

function moduleFixture<T>(path: string, imports: Record<string, unknown>): T {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(source, {
    exports, Error, URL, Response, Request, FormData, Blob, File, Buffer, crypto,
    require: (name: string) => {
      if (Object.hasOwn(imports, name)) return imports[name];
      throw new Error(`Unexpected test import: ${name}`);
    },
  });
  return exports as T;
}

type MediaGet = { GET: (request: Request, context: { params: Promise<{ eventId: string; mediaId: string }> }) => Promise<Response> };

function mediaFixture(kind: "owner" | "public", metadata: unknown, processingFails = false, authorized = true) {
  const downloads: string[] = [];
  const storage = { from: () => ({ download: async (path: string) => { downloads.push(path); return { data: new Blob(["image"]), error: null }; } }) };
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: metadata, error: null }) };
  const imports = {
    "@/lib/media-response": { mediaResponse: async () => { if (processingFails) throw new Error("corrupt image internal detail"); return new Response("image"); } },
    "@/lib/host-event": { isUuid: uuid, requireHostEvent: async () => { if (!authorized) throw new Error("Sign in again to manage your invitation."); return { client: { from: () => query, storage } }; } },
    "@/lib/supabase/storage": { EVENT_MEDIA_BUCKET: "event-media" },
    "@/lib/media-path": { safePublishedMedia },
    "@/lib/supabase/public": { createPublicClient: () => ({ rpc: async () => ({ data: authorized ? metadata : null, error: null }) }) },
    "@/lib/supabase/media-server": { createMediaServiceClient: () => ({ storage }) },
  };
  const source = kind === "owner" ? "src/app/dashboard/events/[eventId]/media/[mediaId]/route.ts" : "src/app/media/[mediaId]/route.ts";
  const route = moduleFixture<MediaGet>(source, imports);
  return { get: () => route.GET(new Request(`https://example.test/media/${mediaId}?w=320`), { params: Promise.resolve({ eventId, mediaId }) }), downloads };
}

test("owner and public photo routes catch asynchronous image-processing failures", async () => {
  const photo = { event_id: eventId, storage_path: `${eventId}/photo.webp`, mime_type: "image/webp" };
  for (const kind of ["owner", "public"] as const) {
    const route = mediaFixture(kind, photo, true);
    const response = await route.get();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).not.toContain("internal detail");
    expect(route.downloads).toEqual([photo.storage_path]);
  }
});

test("photo delivery rejects unsafe metadata and missing authorization before storage access", async () => {
  const photo = { event_id: eventId, storage_path: `${eventId}/photo.webp`, mime_type: "image/webp" };
  for (const kind of ["owner", "public"] as const) {
    for (const metadata of [null, { ...photo, storage_path: `${otherId}/photo.webp` }, { ...photo, storage_path: `${eventId}/../${otherId}/photo.webp` }, { ...photo, mime_type: "text/html" }]) {
      const route = mediaFixture(kind, metadata);
      expect((await route.get()).status).toBe(404);
      expect(route.downloads).toEqual([]);
    }
    const denied = mediaFixture(kind, photo, false, false);
    expect((await denied.get()).status).toBe(404);
    expect(denied.downloads).toEqual([]);
  }
});

test("audio upload and cleanup use canonical UUID paths and preserve the saved track", async () => {
  const paths: string[] = [];
  const removed: string[] = [];
  const savedAudio = { eventId, id: mediaId, name: "Our song.mp3" };
  const actions = moduleFixture<{
    prepareAudioUpload: (eventId: string, name: string, size: number) => Promise<{ path?: string }>;
    discardAudioUpload: (eventId: string, id: string) => Promise<{ error?: string }>;
  }>("src/app/dashboard/audio-actions.ts", {
    "@/lib/host-event": { isUuid: uuid, requireHostEvent: async () => ({ event: { id: eventId, invitation_content: { design: { music: { source: "upload", uploadedAudio: savedAudio } } } } }) },
    "@/lib/audio": audio,
    "@/lib/audio-file": { validateMp3: async () => ({ duration: 10 }) },
    "@/lib/supabase/media-server": { createMediaServiceClient: () => ({ storage: { from: () => ({
      createSignedUploadUrl: async (path: string) => { paths.push(path); return { data: { token: "fixture" }, error: null }; },
      remove: async (objects: string[]) => { removed.push(...objects); return { error: null }; },
    }) } }) },
  });
  const upload = await actions.prepareAudioUpload(eventId.toUpperCase(), "Our song.mp3", 1000);
  expect(upload.path).toMatch(new RegExp(`^${eventId}/[a-f0-9-]+\\.mp3$`));
  expect(paths).toEqual([upload.path]);
  expect(await actions.discardAudioUpload(eventId.toUpperCase(), mediaId.toUpperCase())).toEqual({});
  expect(removed).toEqual([]);
  expect(await actions.discardAudioUpload(eventId.toUpperCase(), otherId.toUpperCase())).toEqual({});
  expect(removed).toEqual([`${eventId}/${otherId}.mp3`]);
});

test("guest RSVP rejects invalid headcounts before RPC and suppresses unexpected server details", async () => {
  let calls = 0;
  let reply: unknown = { ok: true };
  const actions = moduleFixture<{ respondToInvitation: (token: string, state: GuestRsvpState, form: FormData) => Promise<GuestRsvpState> }>("src/app/g/[token]/actions.ts", {
    "@/lib/guest-validation": guestValidation,
    "@/lib/supabase/public": { createPublicClient: () => ({ rpc: async () => { calls++; return { data: reply, error: null }; } }) },
  });
  const form = new FormData();
  form.set("status", "attending"); form.set("partySize", "0");
  expect((await actions.respondToInvitation("a".repeat(64), {}, form)).error).toContain("party size");
  form.set("partySize", "1"); form.set("note", "invalid\u0000note");
  expect((await actions.respondToInvitation("a".repeat(64), {}, form)).error).toContain("note");
  expect(calls).toBe(0);
  form.set("note", "Looking forward to it");
  reply = { error: "Internal database credentials should never reach a guest" };
  expect((await actions.respondToInvitation("a".repeat(64), {}, form)).error).toBe("We couldn’t save your response. Please try again.");
  reply = { error: "Please wait 10 seconds before updating your response." };
  expect((await actions.respondToInvitation("a".repeat(64), {}, form)).error).toContain("10 seconds");
  reply = { ok: true };
  form.set("status", "declined");
  expect((await actions.respondToInvitation("a".repeat(64), {}, form)).success).toContain("sent to the hosts");
});

test("public and private calendar exports return retryable, uncached errors during outages", async () => {
  for (const path of ["src/app/i/[slug]/calendar/route.ts", "src/app/g/[token]/calendar/route.ts"]) {
    const unavailable = async () => { throw new Error("Database internal detail"); };
    const route = moduleFixture<{ GET: (request: Request, context: { params: Promise<{ token: string; slug: string }> }) => Promise<Response> }>(path, {
      "@/lib/public-invitation": { getPublicInvitation: unavailable, getGuestInvitation: unavailable },
      "@/lib/calendar": { invitationCalendar: () => { throw new Error("Should not render"); } },
    });
    const response = await route.GET(new Request("https://example.test/calendar"), { params: Promise.resolve({ slug: "our-celebration", token: "a".repeat(64) }) });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("retry-after")).toBe("30");
    expect(await response.text()).not.toContain("Database internal");
  }
});

test("host action errors preserve actionable session messages but not internal exceptions", () => {
  const { hostActionError } = moduleFixture<{ hostActionError: (error: unknown, fallback: string) => string }>("src/lib/host-event.ts", {
    "server-only": {}, "@/lib/supabase/server": {},
  });
  expect(hostActionError(new Error("Sign in again to manage your invitation."), "Try again.")).toBe("Sign in again to manage your invitation.");
  expect(hostActionError(new Error("Internal connection details"), "Try again.")).toBe("Try again.");
});

test("new guest links carry the persisted guest identity and never store their bearer token", async () => {
  const inserted: Record<string, unknown>[] = [];
  const client = { from: () => ({
    select: () => ({ eq: async () => ({ data: [], error: null }) }),
    insert: async (rows: Record<string, unknown> | Record<string, unknown>[]) => { inserted.push(...(Array.isArray(rows) ? rows : [rows])); return { error: null }; },
  }) };
  type LinkResult = { links?: { guestId: string; name: string; path: string }[]; error?: string };
  const actions = moduleFixture<{
    saveGuest: (eventId: string, input: guestValidation.GuestInput) => Promise<LinkResult>;
    importGuests: (eventId: string, csv: string) => Promise<LinkResult>;
  }>("src/app/dashboard/guest-actions.ts", {
    "node:crypto": crypto, "next/cache": { revalidatePath: () => {} },
    "@/lib/host-event": { isUuid: uuid, requireHostEvent: async () => ({ client }), hostActionError: () => "Please try again." },
    "@/lib/guest-validation": guestValidation,
  });
  const created = await actions.saveGuest(eventId, { name: "Aman", email: "", phone: "", groupId: null, maxPartySize: 2 });
  const imported = await actions.importGuests(eventId, "name,email,phone,group,max_party_size\nAman,,,,1\nAman,,,,2");
  const links = [...(created.links || []), ...(imported.links || [])];
  expect(created.error).toBeUndefined(); expect(imported.error).toBeUndefined();
  expect(links).toHaveLength(3);
  expect(new Set(links.map(link => link.guestId)).size).toBe(3);
  for (const link of links) {
    const row = inserted.find(item => item.id === link.guestId);
    expect(row).toBeDefined();
    const token = link.path.slice(3);
    expect(guestValidation.isGuestToken(token)).toBe(true);
    expect(row?.token_hash).toBe(crypto.createHash("sha256").update(token).digest("hex"));
    expect(JSON.stringify(row)).not.toContain(token);
  }
});

test("a photo quota race removes the unused upload and returns the same clear limit message", async () => {
  const uploaded: string[] = [], removed: string[] = [];
  const image = {
    metadata: async () => ({ format: "jpeg", pages: 1 }),
    rotate: () => image, resize: () => image, webp: () => image,
    toBuffer: async () => ({ data: Buffer.from("webp"), info: { width: 100, height: 100 } }),
  };
  const client = {
    from: () => ({
      select: () => ({ eq: async () => ({ count: 11, error: null }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: "P0001", message: "EVENT_PHOTO_LIMIT_REACHED" } }) }) }),
    }),
    storage: { from: () => ({
      upload: async (path: string) => { uploaded.push(path); return { error: null }; },
      remove: async (paths: string[]) => { removed.push(...paths); return { error: null }; },
    }) },
  };
  const actions = moduleFixture<{ uploadEventPhoto: (eventId: string, form: FormData) => Promise<{ error?: string }> }>("src/app/dashboard/media-actions.ts", {
    sharp: () => image, "next/cache": { revalidatePath: () => {} },
    "@/lib/host-event": { isUuid: uuid, requireHostEvent: async () => ({ client, event: { id: eventId } }), hostActionError: () => "Please try again." },
    "@/lib/media-path": { safePublishedMedia },
    "@/lib/photo-upload": photoUpload,
    "@/lib/supabase/storage": { EVENT_MEDIA_BUCKET: "event-media" },
  });
  const form = new FormData();
  form.set("file", new File(["photo"], "photo.jpg", { type: "image/jpeg" }));
  form.set("alt", "The hosts together");
  expect(await actions.uploadEventPhoto(eventId.toUpperCase(), form)).toEqual({ error: photoUpload.PHOTO_LIMIT_ERROR });
  expect(uploaded).toHaveLength(1);
  expect(uploaded[0]).toMatch(new RegExp(`^${eventId}/`));
  expect(removed).toEqual(uploaded);
});
