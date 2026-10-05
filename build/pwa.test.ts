// @vitest-environment node
// Build code: it reads files next to it, which jsdom's URLs cannot.
import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { PRODUCT_NAME } from "../src/lib/product";

import { serviceWorker, webManifest, type ShellFiles } from "./pwa";

const template = fs.readFileSync(new URL("./sw.template.js", import.meta.url), "utf8");

/** The two values the template's placeholders became. */
function filled(source: string): { version: string; precache: string[] } {
  const version = /const VERSION = "([0-9a-f]+)";/.exec(source)?.[1] ?? "";
  const precache = JSON.parse(/const PRECACHE = (\[.*\]);/.exec(source)?.[1] ?? "null");
  return { version, precache };
}

const shell = (files: Record<string, string>): ShellFiles =>
  new Map(Object.entries({ "./": "<html>", ...files }));

describe("serviceWorker", () => {
  it("fills in the shell first, then the build's files in a fixed order", () => {
    const { version, precache } = filled(
      serviceWorker(template, shell({ "b.js": "b", "a.css": "a" })),
    );

    expect(precache).toEqual(["./", "a.css", "b.js"]);
    expect(version).toMatch(/^[0-9a-f]{12}$/);
  });

  it("changes its version when any file's contents change, names or not", () => {
    const one = filled(serviceWorker(template, shell({ "a.js": "1", "icon.png": "x" }))).version;

    expect(filled(serviceWorker(template, shell({ "icon.png": "x", "a.js": "1" }))).version).toBe(
      one,
    );
    expect(
      filled(serviceWorker(template, shell({ "a.js": "1", "icon.png": "y" }))).version,
    ).not.toBe(one);
    expect(
      filled(
        serviceWorker(
          template,
          new Map([
            ["./", "<html lang>"],
            ["a.js", "1"],
            ["icon.png", "x"],
          ]),
        ),
      ).version,
    ).not.toBe(one);
  });

  it("refuses a template that has lost a placeholder, and a shell with no index.html", () => {
    expect(() => serviceWorker("const VERSION = 1;", shell({}))).toThrow(/placeholder/);
    expect(() => serviceWorker(template, new Map([["a.js", "1"]]))).toThrow(/index\.html/);
  });
});

describe("webManifest", () => {
  const manifest = JSON.parse(webManifest("A description."));

  it("takes the product name from its one source", () => {
    expect(manifest).toMatchObject({ name: PRODUCT_NAME, short_name: PRODUCT_NAME });
    expect(manifest.description).toBe("A description.");
  });

  it("points only at icons that exist, relative to the manifest", () => {
    for (const icon of manifest.icons as { src: string }[]) {
      expect(icon.src).not.toMatch(/^\//);
      expect(fs.existsSync(new URL(`../public/${icon.src}`, import.meta.url))).toBe(true);
    }
  });
});
