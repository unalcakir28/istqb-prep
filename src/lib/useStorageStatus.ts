/**
 * F3-12 — `storageStatus()` for a component: null until the browser has
 * answered, then the answer. Read once per mount; the answer changes only
 * when the candidate asks for persistence, and the screen that asks keeps
 * the result itself.
 */

import { useEffect, useState } from "react";

import { storageStatus, type StorageStatus } from "./storage";

export function useStorageStatus(): StorageStatus | null {
  const [status, setStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void storageStatus().then((value) => {
      if (!cancelled) setStatus(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
