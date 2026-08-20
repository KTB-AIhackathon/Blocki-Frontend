// 실제 백엔드 요청의 Bearer 헤더와 명세 오류 응답 매핑을 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  request,
  requestRedirect,
  resetApiAuth,
  setAccessToken,
} from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    resetApiAuth();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("access token을 현재 브라우저 탭에 보존하고 로그아웃 시 지운다", () => {
    setAccessToken("session-token");

    expect(window.sessionStorage.getItem("blocki.accessToken")).toBe("session-token");
    resetApiAuth();
    expect(window.sessionStorage.getItem("blocki.accessToken")).toBeNull();
  });

  it("sends Bearer and mutation headers with cookies", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "session-1" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("access-token");

    await expect(
      request("/auth/login", {
        method: "POST",
        body: { email: "new@example.com", password: "Password1" },
        idempotencyKey: "idempotency-1",
        ifMatch: '"4"',
      }),
    ).resolves.toEqual({ data: { id: "session-1" } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auth/login");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include" });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      Authorization: "Bearer access-token",
      "Idempotency-Key": "idempotency-1",
      "If-Match": '"4"',
    });
  });

  it("PDF 응답을 Blob으로 반환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("%PDF-1.7", {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await request("/documents/doc-1/versions/version-2/pdf", {
      headers: { Accept: "application/pdf" },
      responseType: "blob",
    });

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/pdf");
    expect(result.size).toBe(8);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/documents/doc-1/versions/version-2/pdf");
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Accept: "application/pdf" });
  });

  it("maps common API errors without exposing raw response details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "입력값을 확인해주세요.",
            fieldErrors: [{ field: "email", reason: "이메일 형식이 아닙니다." }],
            retryable: false,
            traceId: "request-42",
          },
        }),
        {
          status: 422,
          headers: { "X-Request-ID": "request-42" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/auth/signup")).rejects.toMatchObject({
      code: "INVALID_PARAMETER",
      message: "입력값을 확인해주세요.",
      fieldErrors: { email: "이메일 형식이 아닙니다." },
      retryable: false,
      requestId: "request-42",
      traceId: "request-42",
    });
  });

  it("sends Bearer when obtaining an OAuth redirect location", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: "https://github.com/login/oauth/authorize?state=state-1" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("access-token");

    await expect(requestRedirect("/integrations/github/authorize")).resolves.toMatchObject({
      status: 302,
      location: "https://github.com/login/oauth/authorize?state=state-1",
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer access-token" });
  });
});
