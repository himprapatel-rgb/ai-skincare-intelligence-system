// src/pages/ScanPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initScan, uploadScanImage, getScanStatus, getScanResult } from "../services/scanApi";

/**
 * NOTE:
 * - This page is rewritten to use the NEW scanApi.ts exports:
 *   initScan(), uploadScanImage(), getScanStatus(), getScanResult()
 * - It no longer imports/uses `scanApi` object or `ScanApiService`.
 * - It avoids unsafe casting by treating scan result as unknown JSON and displaying it.
 *   If you already have ScanAnalysisResult types/mappers, plug them into `normalizeResult`.
 */

type ScanUiStatus = "idle" | "initializing" | "uploading" | "processing" | "completed" | "failed";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

function isTerminalStatus(status: string): boolean {
  return status === "completed" || status === "failed";
}

/**
 * Safe-ish normalization:
 * If your backend returns a known structure, replace this with a proper mapper:
 * (result: ScanResultResponse) => ScanAnalysisResult
 */
function normalizeResult(result: unknown): unknown {
  return result;
}

export default function ScanPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uiStatus, setUiStatus] = useState<ScanUiStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [scanStatusText, setScanStatusText] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      abortRef.current.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canStart = useMemo(() => uiStatus === "idle" || uiStatus === "failed" || uiStatus === "completed", [uiStatus]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    setScanStatusText(null);
    setSessionId(null);

    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const pollUntilDone = useCallback(async (id: string) => {
    const startedAt = Date.now();

    while (!abortRef.current.aborted) {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        throw new Error("Scan timed out. Please try again.");
      }

      const statusRes = await getScanStatus(id);
      const status = (statusRes?.status ?? "processing").toString();

      setScanStatusText(statusRes?.message ? `${status}: ${statusRes.message}` : status);

      if (isTerminalStatus(status)) {
        if (status === "failed") {
          throw new Error(statusRes?.message || "Scan failed. Please try again.");
        }
        return; // completed
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, []);

  const startScan = useCallback(async () => {
    setError(null);
    setResult(null);
    setScanStatusText(null);

    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    try {
      abortRef.current.aborted = false;

      setUiStatus("initializing");
      const init = await initScan();
      const id = init.session_id;

      setSessionId(id);

      setUiStatus("uploading");
      await uploadScanImage(id, selectedFile);

      setUiStatus("processing");
      await pollUntilDone(id);

      const rawResult = await getScanResult(id);
      const normalized = normalizeResult(rawResult);

      setResult(normalized);
      setUiStatus("completed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error during scan.";
      setError(msg);
      setUiStatus("failed");
    }
  }, [pollUntilDone, selectedFile]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setScanStatusText(null);
    setSessionId(null);
    setUiStatus("idle");
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Face Scan</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Upload a clear, well-lit face photo. We’ll initialize a scan session, upload the image, then poll for results.
      </p>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Choose an image
          </label>
          <input type="file" accept="image/*" onChange={onFileChange} disabled={uiStatus === "processing" || uiStatus === "uploading" || uiStatus === "initializing"} />

          {previewUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
              <img
                src={previewUrl}
                alt="Selected preview"
                style={{ width: "100%", maxWidth: 420, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              onClick={startScan}
              disabled={!selectedFile || !canStart}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                cursor: !selectedFile || !canStart ? "not-allowed" : "pointer",
              }}
            >
              {uiStatus === "initializing"
                ? "Initializing..."
                : uiStatus === "uploading"
                ? "Uploading..."
                : uiStatus === "processing"
                ? "Scanning..."
                : "Start scan"}
            </button>

            <button
              onClick={reset}
              disabled={uiStatus === "processing" || uiStatus === "uploading" || uiStatus === "initializing"}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                cursor: uiStatus === "processing" || uiStatus === "uploading" || uiStatus === "initializing" ? "not-allowed" : "pointer",
                opacity: uiStatus === "processing" || uiStatus === "uploading" || uiStatus === "initializing" ? 0.6 : 1,
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>
            <div><strong>Status:</strong> {uiStatus}</div>
            {sessionId && <div><strong>Session ID:</strong> {sessionId}</div>}
            {scanStatusText && <div><strong>Scan:</strong> {scanStatusText}</div>}
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,0,0,0.06)",
                border: "1px solid rgba(255,0,0,0.18)",
              }}
            >
              <strong style={{ display: "block", marginBottom: 4 }}>Error</strong>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 420px" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>

          {uiStatus === "idle" && (
            <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", opacity: 0.85 }}>
              Select an image and click <strong>Start scan</strong>.
            </div>
          )}

          {(uiStatus === "initializing" || uiStatus === "uploading" || uiStatus === "processing") && (
            <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Processing…</div>
              <div style={{ opacity: 0.85 }}>
                {scanStatusText ? scanStatusText : "Working on it. This can take a few moments."}
              </div>
            </div>
          )}

          {uiStatus === "completed" && (
            <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Scan completed</div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "rgba(0,0,0,0.04)",
                  padding: 12,
                  borderRadius: 10,
                  overflow: "auto",
                  maxHeight: 520,
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {uiStatus === "failed" && (
            <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Scan failed</div>
              <div style={{ opacity: 0.85 }}>Fix the issue and try again.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
