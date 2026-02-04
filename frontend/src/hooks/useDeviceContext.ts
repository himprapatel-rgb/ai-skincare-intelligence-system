/**
 * Hook to use device/environment context in the web app.
 * Sync context is available immediately; location/motion/light require user action or permission.
 */
import { useState, useCallback, useEffect } from 'react';
import {
  collectDeviceContextSync,
  collectFullDeviceContext,
  type DeviceContext,
} from '../services/deviceContextService';

export interface UseDeviceContextOptions {
  /** Request full context (location, motion, light) on mount – may trigger permission prompts */
  requestFullOnMount?: boolean;
}

export function useDeviceContext(options: UseDeviceContextOptions = {}) {
  const [context, setContext] = useState<DeviceContext>(() => ({
    ...collectDeviceContextSync(),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: {
    requestLocation?: boolean;
    requestMotion?: boolean;
    requestAmbientLight?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const full = await collectFullDeviceContext({
        requestLocation: opts?.requestLocation ?? true,
        requestMotion: opts?.requestMotion ?? true,
        requestAmbientLight: opts?.requestAmbientLight ?? false,
      });
      setContext(full);
      return full;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to collect device context';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.requestFullOnMount) {
      refresh({ requestLocation: true, requestMotion: false, requestAmbientLight: false });
    }
  }, [options.requestFullOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncOnly = useCallback(() => {
    setContext((prev) => ({ ...prev, ...collectDeviceContextSync() }));
  }, []);

  return {
    context,
    loading,
    error,
    refresh,
    syncOnly,
  };
}
