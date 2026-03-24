// ScanContext — Shared scan history state to prevent duplicate fetches
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getScanHistory } from '../services/scanApi';
import { useAuth } from './AuthContext';

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
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    if (!user) {
      setScanHistory([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getScanHistory();
      const items = Array.isArray(data) ? data : (data as { scans?: ScanHistoryItem[] }).scans || [];
      setScanHistory(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch once on mount if user is authenticated
  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      void refreshHistory();
    }
    if (!user) {
      fetchedRef.current = false;
      setScanHistory([]);
    }
  }, [user, refreshHistory]);

  const latestScan = scanHistory.length > 0 ? scanHistory[0] : null;

  // Extract scores for sparkline (last 10, most recent last)
  const recentScores = scanHistory
    .slice(0, 10)
    .map((scan) => {
      const meta = scan.scan_metadata as Record<string, unknown> | undefined;
      const result = meta?.result as Record<string, unknown> | undefined;
      const analysis = result?.analysis as Record<string, unknown> | undefined;
      const summary = analysis?.summary as Record<string, unknown> | undefined;
      return (summary?.overall_score as number) ?? null;
    })
    .filter((s): s is number => s !== null)
    .reverse();

  return (
    <ScanContext.Provider
      value={{
        scanHistory,
        latestScan,
        isLoading,
        error,
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
