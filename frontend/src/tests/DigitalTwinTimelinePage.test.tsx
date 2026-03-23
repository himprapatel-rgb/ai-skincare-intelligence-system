import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../constants/storage";
import DigitalTwinTimelinePage from "../pages/DigitalTwinTimelinePage";

describe("DigitalTwinTimelinePage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "token");
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders empty state when no snapshots are available", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ snapshots: [], timeline: { points: [] } }),
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DigitalTwinTimelinePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Your Digital Skin Twin")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create Your Digital Twin/i })).toBeInTheDocument();
    });
  });

  it("renders summary insights and snapshot details", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        latest_snapshot: {
          snapshot_id: "snapshot-2",
        },
        snapshots: [
          {
            snapshot_id: "snapshot-2",
            created_at: "2026-01-15T10:05:00Z",
            skin_mood: "balanced",
            global_state_vector: {
              hydration_level: 0.7,
              oiliness_level: 0.3,
              sensitivity_level: 0.4,
              barrier_impairment: 0.2,
              inflammation_level: 0.1,
              pigmentation_issues: 0.5,
              aging_signs: 0.25,
              congestion_level: 0.2,
            },
            meta: {
              overall_score: 82,
              image_url: "https://example.com/scan.jpg",
              concerns: ["redness"],
            },
          },
        ],
        timeline: {
          points: [
            {
              snapshot_id: "snapshot-2",
              overall_score: 82,
            },
          ],
          summary_insights: {
            trend: "improving",
            best_improvement: "Redness",
            top_concern: "Acne",
          },
        },
        insights: {
          delta_score: 12,
        },
      }),
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DigitalTwinTimelinePage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: /digital twin/i })).toBeInTheDocument();
        expect(screen.getByText("Top Concerns")).toBeInTheDocument();
        expect(screen.getByText(/improving/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.getAllByText("82").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Balanced").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Redness").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Acne").length).toBeGreaterThan(0);
  });
});
