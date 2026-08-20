// 비로그인 사용자의 전체 화면 인증 진입과 로그인·회원가입 전환을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";
import { AuthProvider } from "../../state/AuthContext";

function renderAuthPage() {
  const api = {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    login: vi.fn().mockResolvedValue({ user: null }),
    signup: vi.fn().mockResolvedValue({ ok: true }),
    startGoogleAuth: vi.fn().mockResolvedValue({ user: { id: "google-user", email: "google@example.com" } }),
    logout: vi.fn().mockResolvedValue({ ok: true }),
  };

  render(
    <AuthProvider api={api} skipBootstrap initialModalView="LOGIN">
      <AuthPage />
    </AuthProvider>,
  );

  return api;
}

describe("AuthPage", () => {
  it("로그인 화면을 전체 인증 진입점으로 표시한다", () => {
    renderAuthPage();

    expect(screen.getByRole("heading", { name: "Blocki 로그인" })).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.queryByLabelText("로그인 아이디")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
  });

  it("로그인과 회원가입 화면을 전환한다", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.getByRole("heading", { name: "Blocki 회원가입" })).toBeInTheDocument();
    expect(screen.queryByLabelText("로그인 아이디")).not.toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
  });
});
