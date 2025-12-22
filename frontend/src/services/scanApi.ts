// src/api/scanApi.ts

import type { ScanInitResponse } from "../types/scan";

export type ScanStatusResponse = {
  status: "pending" | "processing" | "completed" | "failed" | string;
  message?: string;
  progress?: number;
};

export type ScanResultResponse = Record<string, unknown>;

/**
 * IMPORTANT:
 * - This file intentionally DOES NOT use any `api` axios instance (so “Cannot find name 'api'” is impossible).
 * - This file intentionally DOES NOT use RegExp flags at all (so TS1499 is impossible).
 * - Replace your scanApi.ts ENTIRELY with this file.
 */

// Vite env var (string). If empty => same-origin requests.
const API_BASE: string = typeof import.meta !== "undefined" && import.meta.env
  ? String(import.meta.env.VITE_API_URL ?? "")
  : "";

// Avoid regex to prevent “unknown regexp flag” issues caused by accidental edits.
function trimTrailingSlash(input: string): string {
  if (input.length > 1 && input.endsWith("/")) return input.slice(0, -1);
  return input;
}

function buildUrl(path: string): string {
  const base = trimTrailingSlash(API_BASE);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), init);

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
 */
export async function initScan(): Promise<ScanInitResponse> {
  return fetchJson<ScanInitResponse>("/api/v1/scan/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
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
 * GET /api/v1/scan/{session_id}/result
 */
export async function getScanResult(sessionId: string): Promise<ScanResultResponse> {
  return fetchJson<ScanResultResponse>(`/api/v1/scan/${encodeURIComponent(sessionId)}/result`, {
    method: "GET",
  });
}

/**
 * Convenience helper: init -> upload
 */
export async function initAndUpload(file: File): Promise<ScanInitResponse> {
  const init = await initScan();
  await uploadScanImage(init.session_id, file);
  return init;
}
