/api/scan  /api/v1/scan// src/api/scanApi.ts

import type { ScanInitResponse } from "../types/scan";

/**
 * Optional: If you already have stronger types for these, replace these with imports.
 * Keeping them permissive here avoids new TS errors.
 */
export type ScanStatusResponse = {
  status: "pending" | "processing" | "completed" | "failed" | string;
  message?: string;
  progress?: number;
};

export type ScanResultResponse = Record<string, unknown>;

/**
 * Base API URL:
 * - In local dev you can set VITE_API_URL="http://localhost:8000"
 * - In production, leaving it empty works if frontend and backend share the same domain
 * (or you proxy through Railway).
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Small helper to build URLs safely */
function url(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

/** Common JSON fetch helper with better error messages */
async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  // Try to capture server error details (JSON or text)
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    throw new Error(`Scan API error ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }

  return (await res.json()) as T;
}

/**
 * initScan
 * Backend returns: { session_id: string }
 */
export async function initScan(): Promise<ScanInitResponse> {
  return fetchJson<ScanInitResponse>(url("/api/v1/scan/init"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // If your backend expects a JSON body, add it here. Otherwise keep empty.
    body: JSON.stringify({}),
  });
}

/**
 * uploadScanImage
 * Upload an image for a scan session.
 */
export async function uploadScanImage(sessionId: string, file: File): Promise<{ ok: true }> {
  const formData = new FormData();
  formData.append("file", file);
  // Some backends expect "image" instead of "file".
  // If yours expects "image", change the key above to "image".

  await fetchJson<unknown>(url(`/api/v1/scan/${encodeURIComponent(sessionId)}/upload`), {
    method: "POST",
    body: formData,
  });

  return { ok: true };
}

/**
 * getScanStatus
 */
export async function getScanStatus(sessionId: string): Promise<ScanStatusResponse> {
  return fetchJson<ScanStatusResponse>(url(`/api/v1/scan/${encodeURIComponent(sessionId)}/status`), {
    method: "GET",
  });
}

/**
 * getScanResult
 */
export async function getScanResult(sessionId: string): Promise<ScanResultResponse> {
  return fetchJson<ScanResultResponse>(url(`/api/v1/scan/${encodeURIComponent(sessionId)}/result`), {
    method: "GET",
  });
}

/**
 * Convenience: full flow helper (optional)
 * init -> upload -> status/result handled by caller
 */
export async function initAndUpload(file: File): Promise<ScanInitResponse> {
  const init = await initScan();
  await uploadScanImage(init.session_id, file);
  return init;
}
