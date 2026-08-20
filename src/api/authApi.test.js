// 명세의 인증 endpoint와 사용자 DTO가 API adapter에 연결되는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthApi } from "./authApi";
import { resetApiAuth } from "./apiClient";

beforeEach(() => {
  resetApiAuth();
  window.sessionStorage.clear();
});

describe("authApi", () => {
  it("회원가입과 로그인 계약을 사용하고 로그인 사용자를 세션에서 복원한다", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { id: "user-1", name: "김블로", email: "new@example.com" } })
      .mockResolvedValueOnce({ data: { accessToken: "token-1", tokenType: "Bearer", expiresAt: "2099-08-19T10:00:00Z", user: { id: "user-1", name: "김블로", email: "new@example.com" } } });
    const authApi = createAuthApi({ request });

    const signupPayload = { password: "Password1", name: "김블로", email: "new@example.com" };
    await authApi.signup(signupPayload);
    await authApi.login({ email: "new@example.com", password: "Password1" });
    await authApi.getCurrentUser();

    expect(request).toHaveBeenNthCalledWith(1, "/auth/sign-up", {
      method: "POST",
      body: signupPayload,
      auth: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, "/auth/login", {
      method: "POST",
      body: { email: "new@example.com", password: "Password1" },
      auth: false,
    });
    await expect(authApi.getCurrentUser()).resolves.toMatchObject({ id: "user-1", name: "김블로" });
    expect(request).toHaveBeenCalledTimes(2);
  });
});
