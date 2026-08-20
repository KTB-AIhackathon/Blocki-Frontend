// 명세의 Notion·GitHub 연동 응답과 OAuth 팝업 시작을 화면 계약으로 변환한다.
import { request } from "./apiClient";

function unwrapData(result) {
  return result?.data ?? result ?? {};
}

function normalizeStatus(status) {
  return status === "NOT_CONNECTED" ? "DISCONNECTED" : status;
}

function normalizeIntegration(integration = {}) {
  return {
    provider: integration.provider,
    status: normalizeStatus(integration.status),
    itemCount: 0,
    accountLabel: integration.accountLabel ?? null,
    connectedAt: integration.connectedAt ?? null,
    errorCode: integration.errorCode ?? null,
  };
}

function createOAuthError(message, code) {
  return Object.assign(new Error(message), { code });
}

function openOAuthPopup(provider) {
  const width = 560;
  const height = 720;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  return window.open(
    "",
    `blocki-${provider.toLowerCase()}-oauth`,
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

function getAuthorizeUrl(result) {
  const authorizeUrl = unwrapData(result).authorizeUrl;
  if (typeof authorizeUrl !== "string" || !authorizeUrl.startsWith("https://")) {
    throw createOAuthError("OAuth 인증 주소를 받지 못했어요.", "OAUTH_AUTHORIZE_URL_INVALID");
  }
  return authorizeUrl;
}

export function createIntegrationApi(client = { request }, options = {}) {
  const openPopup = options.openPopup ?? openOAuthPopup;

  return {
    mode: "api",
    async listIntegrations() {
      const result = await client.request("/integrations");
      return { integrations: (unwrapData(result).items ?? []).map(normalizeIntegration) };
    },
    async connectIntegration(provider) {
      const providerPath = provider.toLowerCase();
      const popup = openPopup(provider);
      if (!popup) {
        throw createOAuthError("팝업이 차단됐어요. 브라우저에서 팝업을 허용해주세요.", "OAUTH_POPUP_BLOCKED");
      }
      try {
        const result = await client.request(`/integrations/${providerPath}/authorize-url`, {
          method: "POST",
        });
        popup.location.replace(getAuthorizeUrl(result));
        return { popupOpened: true, provider };
      } catch (error) {
        popup.close();
        throw error;
      }
    },
    async disconnectIntegration(provider) {
      const result = await client.request(`/integrations/${provider.toLowerCase()}`, {
        method: "DELETE",
      });
      return { integration: normalizeIntegration(unwrapData(result)) };
    },
  };
}

export const integrationApi = createIntegrationApi();
