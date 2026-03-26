// ScanContext — Shared scan history state powered by TanStack Query
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScanHistory } from '../services/scanApi';
import { useAuth } from './AuthContext';
import { queryKeys } from '../api/queryKeys';

interface ScanHistoryItem {
  id: string;
  session_id?: string;
  analysis_id?: string;
  status: string;
  created_at: string;
  scan_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ScanContextValue {
  scanHistory: ScanHistoryItem[];
  latestScan: ScanHistoryItem | null;
  isLoading: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
  /** Recent scores for sparkline (most recent last) */
  recentScores: number[];
}

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.scans.history(user?.id ?? 0),
    queryFn: async () => {
      const data = await getScanHistory();
      const items = Array.isArray(data) ? data : (data as { scans?: ScanHistoryItem[] }).scans || [];
      return items as ScanHistoryItem[];
    },
    enabled: !!user,
  });

  const scanHistory = data ?? [];

  const refreshHistory = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.scans.history(user.id) });
  }, [user, queryClient]);

  const latestScan = scanHistory.length > 0 ? scanHistory[0] : null;

  // Extract scores for sparkline (last 10, most recent last)
  const recentScores = useMemo(
    () =>
      scanHistory
        .slice(0, 10)
        .map((scan) => {
          const meta = scan.scan_metadata as Record<string, unknown> | undefined;
          const result = meta?.result as Record<string, unknown> | undefined;
          const analysis = result?.analysis as Record<string, unknown> | undefined;
          const summary = analysis?.summary as Record<string, unknown> | undefined;
          return (summary?.overall_score as number) ?? null;
        })
        .filter((s): s is number => s !== null)
        .reverse(),
    [scanHistory]
  );

  return (
    <ScanContext.Provider
      value={{
        scanHistory,
        latestScan,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to load scan history') : null,
        refreshHistory,
        recentScores,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanHistory(): ScanContextValue {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    throw new Error('useScanHistory must be used within <ScanProvider>');
  }
  return ctx;
}
