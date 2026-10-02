import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader whenever its dependencies change and exposes
 * { data, error, loading, reload }. Stale responses are ignored so a slow
 * request can never overwrite a newer one.
 */
export function useAsync(loader, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = (seq.current += 1);
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === seq.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, enabled]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
