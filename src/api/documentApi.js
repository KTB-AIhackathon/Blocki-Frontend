// 명세의 문서 목록·버전 응답을 화면용 문서 adapter로 변환한다.
import { createIdempotencyKey, request } from "./apiClient";

function unwrapData(result) {
  return result?.data ?? result ?? {};
}

function normalizeVersion(version = {}, documentId = version.documentId, versionId = version.id) {
  return {
    id: versionId,
    documentId,
    type: version.type,
    title: version.title,
    versionNumber: version.version,
    createdAt: version.createdAt,
    markdown: version.markdown,
    source: version.source,
  };
}

function normalizeSummary(document = {}) {
  const latest = document.latestVersion;
  return {
    id: document.id,
    type: document.type,
    title: document.title,
    latestVersionId: latest?.id ?? null,
    versionCount: document.versionCount ?? 0,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    versions: latest ? [{ id: latest.id, versionNumber: latest.version, createdAt: latest.createdAt }] : [],
  };
}

function normalizeAutomation(automation = {}) {
  return {
    enabled: automation.enabled === true,
    schedule: {
      dayOfWeek: automation.schedule?.dayOfWeek ?? "MONDAY",
      time: automation.schedule?.time ?? "21:00",
      timezone: automation.schedule?.timezone ?? "Asia/Seoul",
    },
  };
}

function withQuery(path, values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value != null) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function createDocumentApi(client = { request }) {
  async function getDocumentVersion(documentId, versionId, options = {}) {
    const path = `/documents/${documentId}/versions/${versionId}`;
    const result = options.signal
      ? await client.request(path, { signal: options.signal })
      : await client.request(path);
    return normalizeVersion(unwrapData(result), documentId, versionId);
  }

  async function downloadDocumentVersionPdf(documentId, versionId) {
    return client.request(`/documents/${documentId}/versions/${versionId}/pdf`, {
      headers: { Accept: "application/pdf, application/json" },
      responseType: "blob",
    });
  }

  return {
    mode: "api",
    async listDocuments({ type, page = 0, size = 20, sort = "latestVersionCreatedAt,DESC" } = {}) {
      const result = await client.request(withQuery("/documents", { type, page, size, sort }));
      const data = unwrapData(result);
      const documents = await Promise.all((data.items ?? []).map(async (item) => {
        const summary = normalizeSummary(item);
        const versionsResult = await client.request(withQuery(`/documents/${item.id}/versions`, {
          page: 0,
          size: 100,
          sort: "version,ASC",
        }));
        const versions = (unwrapData(versionsResult).items ?? []).map((version) => ({
          id: version.id,
          versionNumber: version.version,
          createdAt: version.createdAt,
        }));
        return { ...summary, versions };
      }));
      return {
        documents,
        page: data.page,
        dataNotice: data.notice ?? null,
        missingData: data.missingData ?? [],
      };
    },

    getDocumentVersion,
    downloadDocumentVersionPdf,

    async generateDocument(type, idempotencyKey = createIdempotencyKey()) {
      const result = await client.request("/documents/generations", {
        method: "POST",
        body: { type },
        idempotencyKey,
      });
      return unwrapData(result);
    },

    async getDocumentGeneration(jobId, options = {}) {
      const path = `/document-generation-jobs/${jobId}`;
      const result = options.signal
        ? await client.request(path, { signal: options.signal })
        : await client.request(path);
      return unwrapData(result);
    },

    async getDocumentGenerationAutomation() {
      const result = await client.request("/document-generation-automation");
      return normalizeAutomation(unwrapData(result));
    },

    async updateDocumentGenerationAutomation(enabled) {
      const result = await client.request("/document-generation-automation", {
        method: "PUT",
        body: { enabled },
      });
      return normalizeAutomation(unwrapData(result));
    },
  };
}

export const documentApi = createDocumentApi();
