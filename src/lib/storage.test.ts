import { afterEach, describe, expect, it, vi } from "vitest";

const open = vi.fn<() => Promise<unknown>>();
vi.mock("@/lib/db/db", () => ({ db: { open: () => open() } }));

const { requestPersistence, storageStatus } = await import("./storage");

/** Replaces `navigator.storage` for one test. */
function withStorage(storage: Partial<StorageManager> | undefined): void {
  Object.defineProperty(navigator, "storage", { value: storage, configurable: true });
}

afterEach(() => {
  open.mockReset();
  withStorage(undefined);
});

describe("storageStatus", () => {
  it("is unavailable when IndexedDB does not open, whatever the browser says", async () => {
    open.mockRejectedValue(new Error("blocked"));
    withStorage({ persisted: () => Promise.resolve(true) });

    expect(await storageStatus()).toBe("unavailable");
  });

  it("reads the browser's answer once the database opens", async () => {
    open.mockResolvedValue(undefined);

    withStorage({ persisted: () => Promise.resolve(true) });
    expect(await storageStatus()).toBe("persistent");

    withStorage({ persisted: () => Promise.resolve(false) });
    expect(await storageStatus()).toBe("best-effort");
  });

  it("is unknown when the browser has no answer to give", async () => {
    open.mockResolvedValue(undefined);

    withStorage(undefined);
    expect(await storageStatus()).toBe("unknown");

    withStorage({ persisted: () => Promise.reject(new Error("no")) });
    expect(await storageStatus()).toBe("unknown");
  });
});

describe("requestPersistence", () => {
  it("returns the browser's decision, and false where it cannot ask", async () => {
    withStorage({ persist: () => Promise.resolve(true) });
    expect(await requestPersistence()).toBe(true);

    withStorage({ persist: () => Promise.reject(new Error("no")) });
    expect(await requestPersistence()).toBe(false);

    withStorage(undefined);
    expect(await requestPersistence()).toBe(false);
  });
});
