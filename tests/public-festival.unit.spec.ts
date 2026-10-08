import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";
import * as draftValidation from "../src/lib/invitation-draft";
import * as themes from "../src/data/themes";
import { occasionDemo } from "../src/data/occasion-demos";
import type { PublicInvitation } from "../src/lib/public-invitation";

const imports: Record<string, unknown> = {
  "server-only": {}, react: { cache: (fn: unknown) => fn },
  "@/lib/env": { getSupabaseConfig: () => null }, "@/lib/supabase/public": {},
  "@/lib/invitation-draft": draftValidation, "@/data/themes": themes,
};
const exported: { parsePublicInvitation?: (value: unknown) => PublicInvitation | null } = {};
runInNewContext(ts.transpileModule(readFileSync("src/lib/public-invitation.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: exported, require: (name: string) => { if (!(name in imports)) throw new Error(`Unexpected import ${name}`); return imports[name]; },
});

test("public parser keeps a projected custom festival title and selected opening for zero-function guest groups", () => {
  const invitation = occasionDemo("festival", "royal", "diwali");
  invitation.festival!.title = "ਸਾਡੇ ਘਰ ਦੀ ਦੀਵਾਲੀ";
  invitation.weddingAt = "2027-10-22T18:00:00+05:30";
  invitation.design!.opening = { style: "flowers", icon: "flower", line: "Welcome" };
  invitation.functions = [];
  const payload = { id: "aaaaaaaa-1111-4111-a111-aaaaaaaaaaaa", slug: "family-festival", title: "Simran & family", theme_id: "royal", music_enabled: false, invitation_content: invitation, photos: [], updates: [] };
  const parsed = exported.parsePublicInvitation!(payload);
  expect(parsed?.invitation.festival).toEqual(invitation.festival);
  expect(parsed?.invitation.design?.opening).toEqual(invitation.design?.opening);
  expect(parsed?.invitation.functions).toEqual([]);
  expect(exported.parsePublicInvitation!({ ...payload, invitation_content: { ...invitation, festival: { preset: "unsupported", title: "Invalid" } } })).toBeNull();
});
