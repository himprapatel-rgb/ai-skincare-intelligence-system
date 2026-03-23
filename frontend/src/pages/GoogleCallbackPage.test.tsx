import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import GoogleCallbackPage from "./GoogleCallbackPage";

const mockNavigate = vi.fn();
const mockLoginWithToken = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    loginWithToken: mockLoginWithToken,
  }),
}));

const mockApiPost = vi.fn();
const mockApiGet = vi.fn();
vi.mock("../services/api", () => ({
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

describe("GoogleCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: {} });
  });

  it("shows Sign-in Failed with connection tip when backend is unreachable", async () => {
    mockApiPost.mockRejectedValue({
      detail:
        "We couldn't reach the server. Check your connection and try again — or the service may be temporarily unavailable (try again in a moment).",
      status: 0,
    });

    render(
      <MemoryRouter
        initialEntries={["/auth/google/callback?code=test-code"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <GoogleCallbackPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: /sign-in failed/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(
      screen.getByText(/couldn't reach the server|temporarily unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/try "Continue with Google" again in a moment/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to sign in/i })).toBeInTheDocument();
  });

  it("shows error when Google returns error param", async () => {
    render(
      <MemoryRouter
        initialEntries={["/auth/google/callback?error=access_denied"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <GoogleCallbackPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign-in failed/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/cancelled or failed/i)).toBeInTheDocument();
  });
});
