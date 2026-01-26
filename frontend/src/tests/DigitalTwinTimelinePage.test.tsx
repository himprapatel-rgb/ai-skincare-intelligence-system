import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DigitalTwinTimelinePage from "../pages/DigitalTwinTimelinePage";

describe("DigitalTwinTimelinePage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    localStorage.setItem("auth_token", "token");
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
      <MemoryRouter>
        <DigitalTwinTimelinePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Complete a scan to generate your first digital twin snapshot.")).toBeInTheDocument();
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
      <MemoryRouter>
        <DigitalTwinTimelinePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Digital Twin Timeline")).toBeInTheDocument();
      expect(screen.getByText("improving")).toBeInTheDocument();
      expect(screen.getAllByText("Redness").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Acne").length).toBeGreaterThan(0);
      expect(screen.getByText("Top Concerns")).toBeInTheDocument();
      expect(screen.getByText("Score: 82")).toBeInTheDocument();
      expect(screen.getByText("Mood: Balanced")).toBeInTheDocument();
    });
  });
});
