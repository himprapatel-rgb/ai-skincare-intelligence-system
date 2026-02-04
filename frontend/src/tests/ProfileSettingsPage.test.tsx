import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProfileSettingsPage from "../pages/ProfileSettingsPage";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "test@example.com", full_name: "Test User" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" as const }),
}));

vi.mock("../context/ShelfContext", () => ({
  useShelf: () => ({ totalCount: 0 }),
}));

vi.mock("../services/api", () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error("no profile")),
    patch: vi.fn(),
  },
}));

vi.mock("../services/scanApi", () => ({
  getScanHistory: vi.fn().mockResolvedValue({ scans: [] }),
}));

describe("ProfileSettingsPage", () => {
  it("renders profile settings with section titles when authenticated", async () => {
    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>
    );

    await expect(screen.findByText("My Skin")).resolves.toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows Personal Info and Skin Goals in sidebar", () => {
    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Skin Goals")).toBeInTheDocument();
  });
});
