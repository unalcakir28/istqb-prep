import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentClient } from "./contentClient";

/**
 * The content cache across visits. jsdom has no Cache API, so a small fake
 * stands in for it: named caches holding a JSON body per URL, which is all
 * `contentClient` asks of the real one.
 */
class FakeCaches {
  stores = new Map<string, Map<string, string>>();

  async open(name: string) {
    let store = this.stores.get(name);
    if (!store) {
      store = new Map();
      this.stores.set(name, store);
    }
    const entries = store;
    return {
      match: async (url: string) => {
        const body = entries.get(url);
        return body === undefined ? undefined : new Response(body);
      },
      put: async (url: string, response: Response) => {
        entries.set(url, await response.text());
      },
    };
  }

  async keys() {
    return [...this.stores.keys()];
  }

  async delete(name: string) {
    return this.stores.delete(name);
  }
}

const INDEX_URL = "/data/ctfl-v4.0.1/questions/index.json";

function serve(version: string, questionCount: number) {
  return vi.fn(async (url: string) => {
    if (url.endsWith("manifest.json")) {
      return new Response(JSON.stringify({ dataVersion: version, certifications: [] }));
    }
    return new Response(JSON.stringify({ dataVersion: version, count: questionCount }));
  });
}

let fakeCaches: FakeCaches;

beforeEach(() => {
  fakeCaches = new FakeCaches();
  vi.stubGlobal("caches", fakeCaches);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("contentClient cache", () => {
  it("does not serve a previous visit's content once the version has changed", async () => {
    // Visit one fills the cache under the old version.
    vi.stubGlobal("fetch", serve("v1", 256));
    const first = new ContentClient();
    expect((await first.getIndex("ctfl-v4.0.1")).count).toBe(256);

    // Visit two is a fresh page load — a new client — after a content release.
    const fetchV2 = serve("v2", 302);
    vi.stubGlobal("fetch", fetchV2);
    const second = new ContentClient();

    expect((await second.getIndex("ctfl-v4.0.1")).count).toBe(302);
    expect(fetchV2).toHaveBeenCalledWith(INDEX_URL);
    expect(await fakeCaches.keys()).toEqual(["istqb-prep-content:v2"]);
  });

  it("serves a repeat visit from the cache while the version stands", async () => {
    vi.stubGlobal("fetch", serve("v1", 256));
    await new ContentClient().getIndex("ctfl-v4.0.1");

    const fetchAgain = serve("v1", 999);
    vi.stubGlobal("fetch", fetchAgain);
    const index = await new ContentClient().getIndex("ctfl-v4.0.1");

    expect(index.count).toBe(256);
    expect(fetchAgain).not.toHaveBeenCalledWith(INDEX_URL);
  });

  it("deletes the cache the app used before caches were named by version", async () => {
    await fakeCaches.open("istqb-prep-content");
    await fakeCaches.open("someone-else");
    vi.stubGlobal("fetch", serve("v1", 256));

    await new ContentClient().getIndex("ctfl-v4.0.1");

    expect((await fakeCaches.keys()).sort()).toEqual(["istqb-prep-content:v1", "someone-else"]);
  });
});
