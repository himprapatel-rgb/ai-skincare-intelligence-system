// src/api/scanApi.ts

import type { ScanInitResponse } from "../types/scan";
import { API_BASE_URL } from "../config";
import { STORAGE_KEYS } from "../constants/storage";

export type ScanStatusResponse = {
  status: "pending" | "processing" | "completed" | "failed" | string;
  message?: string;
  progress?: number;
};

export type ScanResultResponse = Record<string, unknown>;
export type ScanActionsResponse = {
  default_actions: string[];
  supported_actions: {
    sd: string[];
    hd: string[];
  };
};

export type ProgressSummaryPoint = {
  date: string;
  overall_score: number;
  acne: number;
  wrinkles: number;
  hydration: number;
  dark_spots: number;
};

export type ProgressSummaryResponse = {
  points: ProgressSummaryPoint[];
  total_scans: number;
  improvement: number;
};

/**
 * IMPORTANT:
 * - This file intentionally DOES NOT use any `api` axios instance (so “Cannot find name 'api'” is impossible).
 * - This file intentionally DOES NOT use RegExp flags at all (so TS1499 is impossible).
 * - Replace your scanApi.ts ENTIRELY with this file.
 */

/* Same API as rest of app (desktop/mobile/tablet) – single backend, single database */
const API_BASE: string = API_BASE_URL;

// Avoid regex to prevent “unknown regexp flag” issues caused by accidental edits.
function trimTrailingSlash(input: string): string {
  if (input.length > 1 && input.endsWith("/")) return input.slice(0, -1);
  return input;
}

function buildUrl(path: string): string {
  const base = trimTrailingSlash(API_BASE);
  let p = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api/v1") && p.startsWith("/api/v1")) {
    p = p.slice("/api/v1".length) || "/";
  }
  return `${base}${p}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path), { ...init, headers });

  if (!res.ok) {
    // Read error details safely (no regex, no api)
    let detail = "";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data: unknown = await res.json();
        detail = typeof data === "string" ? data : JSON.stringify(data);
      } else {
        detail = await res.text();
      }
    } catch {
      detail = "";
    }

    throw new Error(
      `Scan API error ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`
    );
  }

  // Some endpoints might return empty body; handle safely
  const text = await res.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

/**
 * POST /api/v1/scan/init
 * Backend returns: { session_id: string }
 * Optionally sends device_context (screen, locale, device) from web APIs for scan quality / analytics.
 */
export async function initScan(deviceContext?: Record<string, unknown>): Promise<ScanInitResponse> {
  return fetchJson<ScanInitResponse>("/api/v1/scan/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      deviceContext ? { device_context: deviceContext } : {}
    ),
  });
}

/**
 * POST /api/v1/scan/{session_id}/upload
 */
export async function uploadScanImage(sessionId: string, file: File): Promise<{ ok: true }> {
  const formData = new FormData();
  formData.append("file", file);

  await fetchJson<unknown>(`/api/v1/scan/${encodeURIComponent(sessionId)}/upload`, {
    method: "POST",
    body: formData,
  });

  return { ok: true };
}

/**
 * GET /api/v1/scan/{session_id}/status
 */
export async function getScanStatus(sessionId: string): Promise<ScanStatusResponse> {
  return fetchJson<ScanStatusResponse>(`/api/v1/scan/${encodeURIComponent(sessionId)}/status`, {
    method: "GET",
  });
}

/**
 * GET /api/v1/scan/{session_id}/results
 */
export async function getScanResult(sessionId: string): Promise<ScanResultResponse> {
  return fetchJson<ScanResultResponse>(`/api/v1/scan/${encodeURIComponent(sessionId)}/results`, {
    method: "GET",
  });
}

/**
 * GET /api/v1/scan/history
 */
export async function getScanHistory(): Promise<Record<string, unknown>> {
  return fetchJson<Record<string, unknown>>("/api/v1/scan/history", {
    method: "GET",
  });
}

/**
 * GET /api/v1/scan/actions
 */
export async function getScanActions(): Promise<ScanActionsResponse> {
  return fetchJson<ScanActionsResponse>("/api/v1/scan/actions", {
    method: "GET",
  });
}

/**
 * GET /api/v1/progress/summary
 */
export async function getProgressSummary(range: "week" | "month" | "3months"): Promise<ProgressSummaryResponse> {
  const params = new URLSearchParams({ range });
  return fetchJson<ProgressSummaryResponse>(`/api/v1/progress/summary?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Convenience helper: init (with device context) -> upload
 */
export async function initAndUpload(file: File, deviceContext?: Record<string, unknown>): Promise<ScanInitResponse> {
  const init = await initScan(deviceContext);
  const sessionId = init.session_id ?? init.scan_id;
  if (!sessionId) {
    throw new Error("Scan initialization did not return a session id");
  }
  await uploadScanImage(sessionId, file);
  return init;
}
