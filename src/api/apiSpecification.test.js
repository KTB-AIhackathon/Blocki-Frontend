// Bearer 인증과 공통 data·error 응답 규칙을 API client에 고정한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, resetApiAuth, setAccessToken } from "./apiClient";

describe("API specification client contract", () => {
  beforeEach(() => {
    resetApiAuth();
    vi.restoreAllMocks();
  });

  it("Bearer access token과 JSON 응답을 사용하고 CSRF 호출을 만들지 않는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("access-token");

    await expect(request("/users/me")).resolves.toEqual({ data: { ok: true } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/users/me");
    expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      Authorization: "Bearer access-token",
      Accept: "application/json",
    });
    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-TOKEN"]).toBeUndefined();
  });

  it("{ error } 응답을 공통 오류 객체로 변환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "문서를 찾을 수 없습니다.",
          traceId: "trace-1",
        },
      }), { status: 422 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/documents/document-1"))
      .rejects.toMatchObject({
        code: "DOCUMENT_NOT_FOUND",
        message: "문서를 찾을 수 없습니다.",
        traceId: "trace-1",
      });
  });
});
