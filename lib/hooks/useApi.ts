"use client";

import { useCallback, useEffect, useState } from "react";

/** Minimal fetch-on-mount hook: refetches when `deps` change, `reload()` forces one. */
export function useApi<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flags the start of a fetch; data stays so lists dim instead of flashing
    setLoading(true);
    fn().then(
      (d) => alive && (setData(d), setError(undefined), setLoading(false)),
      (e) => alive && (setError(e), setLoading(false))
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
