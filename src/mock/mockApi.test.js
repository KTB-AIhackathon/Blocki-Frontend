// 명세 기반 로그인·회원가입 Mock이 실제 인증 폼 입력을 처리하는지 검증한다.
import { describe, expect, it } from "vitest";
import { createMockApi } from "./mockApi";

describe("mock auth api", () => {
  it("로그인 사용자를 현재 브라우저 탭에서 복원한다", async () => {
    window.sessionStorage.clear();
    const firstApi = createMockApi();
    await firstApi.login({ email: "miles@example.com", password: "password" });

    const reloadedApi = createMockApi();

    await expect(reloadedApi.getCurrentUser()).resolves.toMatchObject({ email: "miles@example.com" });
  });

  it("accepts email/password auth payloads", async () => {
    const api = createMockApi();

    await api.signup({
      password: "Password1",
      name: "김블로",
      email: "new@example.com",
    });
    const result = await api.login({ email: "new@example.com", password: "Password1" });

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.user.email).toBe("new@example.com");
  });
});
