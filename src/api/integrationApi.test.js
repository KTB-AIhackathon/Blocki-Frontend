// 연동 목록 응답을 화면의 수집 범위 상태로 변환하는 계약을 검증한다.
import { describe, expect, it, vi } from "vitest";
import { createIntegrationApi } from "./integrationApi";

describe("integration API specification", () => {
  it("data.items의 NOT_CONNECTED를 화면 연결 상태로 정규화한다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        items: [
          { provider: "NOTION", status: "CONNECTED", accountLabel: "Blocki Workspace", connectedAt: "2026-08-19T09:00:00Z", errorCode: null },
          { provider: "GITHUB", status: "NOT_CONNECTED", accountLabel: null, connectedAt: null, errorCode: null },
        ],
      },
    });
    const api = createIntegrationApi({ request });

    await expect(api.listIntegrations()).resolves.toMatchObject({
      integrations: [
        { provider: "NOTION", status: "CONNECTED", itemCount: 0 },
        { provider: "GITHUB", status: "DISCONNECTED", itemCount: 0 },
      ],
    });
    expect(request).toHaveBeenCalledWith("/integrations");
  });

  it("연결 시작은 fetch 없이 백엔드 authorize 주소로 브라우저를 이동한다", async () => {
    const requestRedirect = vi.fn(() => Promise.reject(new Error("fetch를 호출하면 안 됩니다.")));
    const navigate = vi.fn();
    const buildApiUrl = vi.fn((path) => `http://localhost:8080/api/v1${path}`);
    const api = createIntegrationApi({ request: vi.fn(), requestRedirect }, { buildApiUrl, navigate });

    await expect(api.connectIntegration("NOTION")).resolves.toEqual({
      redirected: true,
      provider: "NOTION",
      location: "http://localhost:8080/api/v1/integrations/notion/authorize",
    });

    expect(requestRedirect).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("http://localhost:8080/api/v1/integrations/notion/authorize");
  });

  it("연결 해제는 제공자 소문자 경로에 DELETE를 요청한다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        provider: "GITHUB",
        status: "NOT_CONNECTED",
        accountLabel: null,
        connectedAt: null,
        errorCode: null,
      },
    });
    const api = createIntegrationApi({ request });

    await expect(api.disconnectIntegration("GITHUB")).resolves.toMatchObject({
      integration: { provider: "GITHUB", status: "DISCONNECTED" },
    });
    expect(request).toHaveBeenCalledWith("/integrations/github", { method: "DELETE" });
  });
});
