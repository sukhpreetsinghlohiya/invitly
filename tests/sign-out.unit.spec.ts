import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";

const source = ts.transpileModule(readFileSync("src/app/account/sign-out-form.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function formFixture(signOut: () => Promise<{ error?: string }>) {
  let action: (() => Promise<{ error?: string }>) | undefined;
  const exports: { SignOutForm?: () => unknown } = {};
  runInNewContext(source, {
    exports,
    require: (name: string) => {
      if (name === "react") return {
        useActionState: (callback: typeof action, state: object) => { action = callback; return [state, callback, false]; },
        useRef: (value: unknown) => ({ current: value }),
        useState: (value: unknown) => [value, () => {}],
      };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name === "next/navigation") return { unstable_rethrow: (error: { digest?: string }) => { if (error.digest?.startsWith("NEXT_REDIRECT")) throw error; } };
      if (name === "./actions") return { signOut };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  exports.SignOutForm!();
  return action!;
}

test("sign-out transport errors return an inline retry while successful redirects still propagate", async () => {
  const failed = formFixture(async () => { throw new TypeError("Failed to fetch"); });
  expect((await failed()).error).toContain("Check your connection and try signing out again");
  const redirected = { digest: "NEXT_REDIRECT;replace;/login;303;" };
  const successful = formFixture(async () => { throw redirected; });
  expect(await successful().then(() => null, (error: unknown) => error)).toBe(redirected);
  const refused = formFixture(async () => ({ error: "We couldn’t sign you out. Please try again." }));
  expect((await refused()).error).toBe("We couldn’t sign you out. Please try again.");
});
