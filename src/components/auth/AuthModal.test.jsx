// 명세 기반 로그인·회원가입 모달의 화면 전환과 인증 상호작용을 검증한다.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../state/AuthContext";
import AuthModal from "./AuthModal";

function renderAuth(customApi = {}) {
  const api = {
    mode: "mock",
    getCurrentUser: vi.fn().mockResolvedValue(null),
    login: vi.fn().mockResolvedValue({ user: { id: "user-1", email: "demo@example.com" } }),
    signup: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
    startGoogleAuth: vi.fn().mockResolvedValue({ user: { id: "google-user" } }),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    ...customApi,
  };
  render(
    <AuthProvider api={api} skipBootstrap initialModalView="LOGIN">
      <AuthModal />
    </AuthProvider>,
  );
  return api;
}

describe("AuthModal", () => {
  it("switches from login to signup and keeps only the requested fields", async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.getByRole("heading", { name: "Blocki 회원가입" })).toBeInTheDocument();
    expect(screen.queryByLabelText("로그인 아이디")).not.toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/서비스 이용약관/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /GitHub/ })).not.toBeInTheDocument();
  });

  it("does not show authentication routes that are absent from the API specification", async () => {
    const user = userEvent.setup();
    renderAuth();

    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(screen.queryByRole("button", { name: /Google/ })).not.toBeInTheDocument();
  });

  it("returns to login after a spec-compliant signup", async () => {
    const user = userEvent.setup();
    const api = renderAuth();

    await user.click(screen.getByRole("button", { name: "회원가입" }));
    await user.type(screen.getByLabelText("이메일"), "new@example.com");
    await user.type(screen.getByLabelText("이름"), "김블로");
    await user.type(screen.getByLabelText("비밀번호", { exact: true }), "Password1");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Password1");
    await user.click(screen.getByRole("button", { name: "Blocki 시작하기" }));

    expect(api.signup).toHaveBeenCalledWith({
      name: "김블로",
      email: "new@example.com",
      password: "Password1",
    });
    expect(await screen.findByRole("heading", { name: "Blocki 로그인" })).toBeInTheDocument();
  });

  it("shows invalid credential errors and closes with the close button", async () => {
    const user = userEvent.setup();
    const api = renderAuth({
      login: vi.fn().mockRejectedValue({
        code: "INVALID_CREDENTIALS",
        message: "이메일 또는 비밀번호를 확인해주세요.",
      }),
    });

    await user.type(screen.getByLabelText("이메일"), "invalid@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrongpass1");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(api.login).toHaveBeenCalledWith({ email: "invalid@example.com", password: "wrongpass1" });
    expect(await screen.findByText("이메일 또는 비밀번호를 확인해주세요.")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
