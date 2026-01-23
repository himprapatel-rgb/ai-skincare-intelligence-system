import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AuthContext, { AuthResponse, User } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

const renderWithAuth = (authValue: {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  register: () => Promise<AuthResponse>;
  logout: () => void;
  updateUser: () => void;
}) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("AppLayout footer auth links", () => {
  it("shows My Account when authenticated", () => {
    renderWithAuth({
      user: { id: 1, email: "test@example.com", full_name: "Test User" },
      token: "token",
      isAuthenticated: true,
      isLoading: false,
      login: async () => {},
      register: async () => ({ token: "token", user: { id: 1, email: "test@example.com" } }),
      logout: () => {},
      updateUser: () => {},
    });

    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login / Register" })).not.toBeInTheDocument();
  });

  it("shows Login / Register when unauthenticated", () => {
    renderWithAuth({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      register: async () => ({ token: "token", user: { id: 1, email: "test@example.com" } }),
      logout: () => {},
      updateUser: () => {},
    });

    expect(screen.getByRole("link", { name: "Login / Register" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Account" })).not.toBeInTheDocument();
  });
});
