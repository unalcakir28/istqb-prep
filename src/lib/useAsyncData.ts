/**
 * Shared state for screens that load static data.
 *
 * The home, setup, and sources screens each built the same three states
 * separately: loading, data, error + retry. All three also had the same
 * cancellation flag, because if a response arrives after the component has
 * unmounted and calls `setState`, React warns about it.
 *
 * `load` may be redefined on every render; which version is currently
 * running is read via a ref, so the effect isn't retriggered by identity
 * changes.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncData<T> {
  data: T | null;
  failed: boolean;
  /** Reloads from scratch. Used by the "retry" action on the error screen. */
  reload: () => void;
}

export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> {
  const [state, setState] = useState<{ data: T | null; failed: boolean }>({
    data: null,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;

    void loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, failed: false });
      },
      () => {
        if (!cancelled) setState({ data: null, failed: true });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Immediately drop back to loading state; the old error message doesn't
  // stay on screen while the response is pending.
  const reload = useCallback(() => {
    setState({ data: null, failed: false });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, reload };
}
