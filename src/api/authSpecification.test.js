// 인증 API가 합의된 email 로그인 DTO와 사용자 조회 경로를 사용하는지 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthApi } from "./authApi";
import { resetApiAuth } from "./apiClient";

describe("auth API specification", () => {
  beforeEach(() => {
    resetApiAuth();
  });

  it("회원가입은 /auth/sign-up에 명세 DTO를 보낸다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        name: "김블로",
        email: "blocki@example.com",
        createdAt: "2026-08-19T09:00:00Z",
      },
    });
    const api = createAuthApi({ request });
    const payload = {
      password: "example-password",
      name: "김블로",
      email: "blocki@example.com",
    };

    await api.signup(payload);

    expect(request).toHaveBeenCalledWith("/auth/sign-up", {
      method: "POST",
      body: payload,
      auth: false,
    });
  });

  it("로그인은 accessToken을 보관하고 user를 반환한다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        accessToken: "token-1",
        tokenType: "Bearer",
        expiresAt: "2026-08-19T10:00:00Z",
        user: { id: "user-1", name: "김블로", email: "blocki@example.com" },
      },
    });
    const api = createAuthApi({ request });

    await expect(api.login({ email: "blocki@example.com", password: "example-password" }))
      .resolves.toMatchObject({ user: { id: "user-1" }, accessToken: "token-1" });
    expect(request).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "blocki@example.com", password: "example-password" },
      auth: false,
    });
  });

  it("현재 사용자는 /users/me에서 조회한다", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "user-1", email: "blocki@example.com" } });
    const api = createAuthApi({ request });

    await expect(api.getCurrentUser()).resolves.toMatchObject({ id: "user-1", email: "blocki@example.com" });
    expect(request).toHaveBeenCalledWith("/users/me");
  });
});
