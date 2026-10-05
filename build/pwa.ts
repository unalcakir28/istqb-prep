/**
 * F3-07 — what makes the build installable and usable offline, with no
 * plugin dependency: the web app manifest and the service worker, both
 * emitted at build time.
 *
 * The manifest is generated rather than kept in public/, because it carries
 * the product name and that name lives in one place (F0-17,
 * `src/lib/product.ts`). The service worker is `build/sw.template.js` with
 * the build's own file list and a version hashed from those files' contents
 * filled in, so every deploy that changes a file ships a new worker and a new
 * shell cache.
 *
 * The dev server gets neither: `src/lib/registerServiceWorker.ts` registers
 * the worker in production builds only.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

import { PRODUCT_NAME } from "../src/lib/product";

const TEMPLATE = new URL("./sw.template.js", import.meta.url);
/** The manifest's icons, under public/; precached with the shell. */
const ICONS = ["icons/icon-192.png", "icons/icon-512.png"];

/** The light theme's accent and background (`src/styles/index.css`). */
const THEME_COLOR = "#115e59";
const BACKGROUND_COLOR = "#fafaf9";

export function webManifest(description: string): string {
  const manifest = {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description,
    id: "./",
    start_url: "./",
    scope: "./",
    display: "standalone",
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** What one precached file is: its path from the site root, and its bytes. */
export type ShellFiles = ReadonlyMap<string, string | Uint8Array>;

/**
 * The worker's source for one build. `shell` maps each precached path to its
 * contents; "./" is index.html. The version is hashed from the contents, not
 * only the names: index.html, the manifest and the icons carry no hash in
 * their names, and a change to one of them must still ship a new worker.
 */
export function serviceWorker(template: string, shell: ShellFiles): string {
  if (!template.includes("__VERSION__") || !template.includes("__PRECACHE__")) {
    throw new Error("build/sw.template.js has lost a placeholder");
  }
  if (!shell.has("./")) throw new Error("the shell has no index.html");

  const precache = ["./", ...[...shell.keys()].filter((path) => path !== "./").sort()];
  const hash = createHash("sha256");
  for (const path of precache) {
    hash
      .update(path)
      .update("\0")
      .update(shell.get(path) ?? "")
      .update("\0");
  }
  const version = hash.digest("hex").slice(0, 12);

  return template
    .replace('"__VERSION__"', JSON.stringify(version))
    .replace("__PRECACHE__", JSON.stringify(precache));
}

/** Files the shell needs offline: scripts, styles, icons, the manifest. Never data. */
function isShellFile(fileName: string): boolean {
  return !fileName.endsWith(".map") && !fileName.endsWith(".html") && !fileName.startsWith("data/");
}

/** The shell's own description, so the manifest says what the page says. */
function metaDescription(html: string): string {
  const match = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html);
  if (!match) throw new Error("index.html has no meta description for the web app manifest");
  return match[1];
}

export function pwa(): Plugin {
  // Absolute, with Vite's base: a deep link is served the same index.html
  // (GitHub Pages' 404 copy), and a relative href would resolve under it.
  let base = "/";
  let publicDir = "";
  let description = "";

  return {
    name: "pwa",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      base = config.base;
      publicDir = config.publicDir;
    },
    transformIndexHtml(html) {
      description = metaDescription(html);
      return [
        {
          tag: "link",
          attrs: { rel: "manifest", href: `${base}manifest.webmanifest` },
          injectTo: "head",
        },
        { tag: "meta", attrs: { name: "theme-color", content: THEME_COLOR }, injectTo: "head" },
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", href: `${base}icons/icon-192.png` },
          injectTo: "head",
        },
      ];
    },
    generateBundle(_options, bundle) {
      const manifest = webManifest(description);
      this.emitFile({ type: "asset", fileName: "manifest.webmanifest", source: manifest });

      const html = bundle["index.html"];
      if (html?.type !== "asset") throw new Error("the build emitted no index.html to precache");

      const shell = new Map<string, string | Uint8Array>([
        ["./", html.source],
        ["manifest.webmanifest", manifest],
      ]);
      for (const output of Object.values(bundle)) {
        if (!isShellFile(output.fileName)) continue;
        shell.set(output.fileName, output.type === "chunk" ? output.code : output.source);
      }
      for (const icon of ICONS) shell.set(icon, fs.readFileSync(path.join(publicDir, icon)));

      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: serviceWorker(fs.readFileSync(TEMPLATE, "utf8"), shell),
      });
    },
  };
}
