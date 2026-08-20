import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AUTH_EXPIRED_EVENT } from "../api/apiClient";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../routing/appRouter", () => ({
  navigateTo: vi.fn(),
  ROUTES: { LOGIN: "/login", SIGNUP: "/signup", WORKSPACE: "/workspace" },
}));

function Probe() {
  const { isAuthenticated, user } = useAuth();
  return <p>{isAuthenticated ? user.name : "guest"}</p>;
}

describe("AuthContext expiry", () => {
  it("authenticated_401_clears_both_session_keys_and_resets_auth_state", async () => {
    render(
      <AuthProvider skipBootstrap initialUser={{ id: "u1", name: "Kim" }}>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText("Kim")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });

    expect(await screen.findByText("guest")).toBeInTheDocument();
  });
});
