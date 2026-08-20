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

  it("연결 시작은 인증된 요청으로 OAuth URL을 받아 팝업을 이동한다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: { authorizeUrl: "https://github.com/login/oauth/authorize?client_id=client" },
    });
    const popup = { close: vi.fn(), location: { replace: vi.fn() } };
    const openPopup = vi.fn().mockReturnValue(popup);
    const api = createIntegrationApi({ request }, { openPopup });

    await expect(api.connectIntegration("GITHUB")).resolves.toEqual({
      popupOpened: true,
      provider: "GITHUB",
    });

    expect(request).toHaveBeenCalledWith("/integrations/github/authorize-url", { method: "POST" });
    expect(openPopup).toHaveBeenCalledWith("GITHUB");
    expect(popup.location.replace).toHaveBeenCalledWith("https://github.com/login/oauth/authorize?client_id=client");
  });

  it("팝업이 차단되면 API를 요청하지 않고 명확한 오류를 반환한다", async () => {
    const request = vi.fn();
    const api = createIntegrationApi({ request }, { openPopup: vi.fn().mockReturnValue(null) });

    await expect(api.connectIntegration("NOTION")).rejects.toMatchObject({ code: "OAUTH_POPUP_BLOCKED" });
    expect(request).not.toHaveBeenCalled();
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
