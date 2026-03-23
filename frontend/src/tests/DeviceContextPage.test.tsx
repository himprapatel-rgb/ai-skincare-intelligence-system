import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DeviceContextPage from "../pages/DeviceContextPage";

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("../hooks/useDeviceContext", () => ({
  useDeviceContext: () => ({
    context: {
      screen: { width: 375, height: 667, orientation: "portrait-primary" },
      locale: { language: "en", timezone: "UTC" },
      device: { platform: "Win32", hardwareConcurrency: 8 },
      collectedAt: "2026-01-01T00:00:00.000Z",
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
    syncOnly: vi.fn(),
  }),
}));

describe("DeviceContextPage", () => {
  it("renders Device & context heading and main actions", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DeviceContextPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /device & context/i })).toBeInTheDocument();
    expect(screen.getByText(/Copy JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Download JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Update sync info/i)).toBeInTheDocument();
    expect(screen.getByText(/Refresh with permissions/i)).toBeInTheDocument();
  });

  it("has back link to profile", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DeviceContextPage />
      </MemoryRouter>
    );

    const back = screen.getByRole("link", { name: /back to profile/i });
    expect(back).toBeInTheDocument();
    expect(back).toHaveAttribute("href", "/me");
  });

  it("shows Screen and Locale sections", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DeviceContextPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Screen")).toBeInTheDocument();
    expect(screen.getByText("Locale")).toBeInTheDocument();
    expect(screen.getByText("Device")).toBeInTheDocument();
  });
});
