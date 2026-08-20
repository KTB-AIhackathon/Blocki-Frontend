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

  it("로컬 스택의 http://localhost OAuth 주소도 팝업으로 연다", async () => {
    const request = vi.fn().mockResolvedValue({
      data: { authorizeUrl: "http://localhost:9100/github/login/oauth/authorize?client_id=stub" },
    });
    const popup = { close: vi.fn(), location: { replace: vi.fn() } };
    const api = createIntegrationApi({ request }, { openPopup: vi.fn().mockReturnValue(popup) });

    await api.connectIntegration("GITHUB");

    expect(popup.location.replace).toHaveBeenCalledWith(
      "http://localhost:9100/github/login/oauth/authorize?client_id=stub",
    );
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

  it("GitHub 계정 변경은 기존 토큰을 지우지 않고 계정 선택 OAuth 창을 연다", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { authorizeUrl: "https://github.com/login/oauth/authorize?client_id=client" } });
    const popup = { close: vi.fn(), location: { replace: vi.fn() } };
    const api = createIntegrationApi({ request }, { openPopup: vi.fn().mockReturnValue(popup) });

    await expect(api.changeIntegration("GITHUB")).resolves.toMatchObject({
      popupOpened: true,
      provider: "GITHUB",
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("/integrations/github/authorize-url", { method: "POST" });
    expect(popup.location.replace).toHaveBeenCalledWith(
      "https://github.com/login/oauth/authorize?client_id=client&prompt=select_account",
    );
  });

  it("Notion 계정 변경은 지원되지 않는 계정 선택 파라미터를 추가하지 않는다", async () => {
    const authorizeUrl = "https://api.notion.com/v1/oauth/authorize?owner=user&client_id=client";
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { authorizeUrl } });
    const popup = { close: vi.fn(), location: { replace: vi.fn() } };
    const api = createIntegrationApi({ request }, { openPopup: vi.fn().mockReturnValue(popup) });

    await api.changeIntegration("NOTION");

    expect(request).not.toHaveBeenCalledWith("/integrations/notion", { method: "DELETE" });
    expect(popup.location.replace).toHaveBeenCalledWith(authorizeUrl);
  });
});
