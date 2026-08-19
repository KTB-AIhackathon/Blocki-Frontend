// 명세의 Notion·GitHub 연동 응답을 수집 범위 adapter로 변환한다.
import { buildApiUrl, request } from "./apiClient";

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

export function createIntegrationApi(client = { request }, options = {}) {
  const resolveApiUrl = options.buildApiUrl ?? buildApiUrl;
  const navigate = options.navigate ?? ((url) => window.location.assign(url));

  return {
    mode: "api",
    async listIntegrations() {
      const result = await client.request("/integrations");
      return { integrations: (unwrapData(result).items ?? []).map(normalizeIntegration) };
    },
    async connectIntegration(provider) {
      const providerPath = provider.toLowerCase();
      const path = `/integrations/${providerPath}/authorize`;
      const location = resolveApiUrl(path);
      navigate(location);
      return { redirected: true, provider, location };
    },
  };
}

export const integrationApi = createIntegrationApi();
