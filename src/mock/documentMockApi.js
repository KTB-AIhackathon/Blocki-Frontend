// 포트폴리오·이력서 조회 화면을 백엔드 없이 검증할 수 있는 문서 Mock adapter다.
const MOCK_DELAY_MS = 40;

const DEFAULT_INTEGRATIONS = [
  { provider: "GITHUB", status: "CONNECTED", itemCount: 4, connectedAt: "2026-08-18T09:00:00Z" },
  { provider: "NOTION", status: "DISCONNECTED", itemCount: 0, connectedAt: null },
];

const MARKDOWN = {
  PORTFOLIO: `# Blocki 프로젝트 포트폴리오

## 프로젝트 개요

학습 기록과 GitHub 작업을 하나의 읽기 쉬운 포트폴리오 문서로 정리했습니다.

## 담당 역할

- React 기반 화면 구조 설계
- 연결 상태와 문서 조회 흐름 구현

## 기술 스택

React, JavaScript, Vite, CSS
`,
  RESUME: `# Blocki 개발자 이력서

## 소개

사용자의 작업 기록을 실행 가능한 문서로 바꾸는 제품을 만들고 있습니다.

## 핵심 역량

- React 화면 설계와 상태 관리
- API 연동을 고려한 adapter 구조
- 데이터 부족·부분 실패를 고려한 사용자 경험 설계
`,
};

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function delay(value, milliseconds = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(clone(value)), milliseconds);
  });
}

function createVersion(documentId, type, versionNumber, createdAt = "2026-08-18T09:00:00Z") {
  return {
    id: `${type.toLowerCase()}-v${versionNumber}`,
    documentId,
    type,
    title: type === "PORTFOLIO" ? "포트폴리오" : "이력서",
    versionNumber,
    createdAt,
    markdown: MARKDOWN[type],
  };
}

function createSeedDocuments() {
  const portfolio = createVersion("doc-portfolio", "PORTFOLIO", 1);
  const resume = createVersion("doc-resume", "RESUME", 1);
  return {
    summaries: [
      {
        id: portfolio.documentId,
        type: portfolio.type,
        title: portfolio.title,
        latestVersionId: portfolio.id,
        versions: [{ id: portfolio.id, versionNumber: portfolio.versionNumber, createdAt: portfolio.createdAt }],
      },
      {
        id: resume.documentId,
        type: resume.type,
        title: resume.title,
        latestVersionId: resume.id,
        versions: [{ id: resume.id, versionNumber: resume.versionNumber, createdAt: resume.createdAt }],
      },
    ],
    versions: {
      [portfolio.id]: portfolio,
      [resume.id]: resume,
    },
  };
}

export function createDocumentMockApi({ scenario = "SUCCESS", initialIntegrations = DEFAULT_INTEGRATIONS } = {}) {
  const seed = createSeedDocuments();
  const state = {
    integrations: clone(initialIntegrations),
    documents: seed,
    scenario,
  };
  const generationJobs = new Map();

  return {
    mode: "mock",
    async listIntegrations() {
      return delay({ integrations: state.integrations });
    },
    async listDocuments() {
      if (state.scenario === "INSUFFICIENT_DATA") {
        return delay({
          documents: state.documents.summaries,
          dataNotice: "INSUFFICIENT_DATA",
          missingData: ["오늘 기록"],
        });
      }
      if (state.scenario === "PARTIAL_DATA") {
        return delay({
          documents: state.documents.summaries,
          dataNotice: "PARTIAL_DATA",
          missingData: [{ provider: "NOTION", reason: "페이지 조회에 실패했습니다." }],
        });
      }
      return delay({ documents: state.documents.summaries, dataNotice: null, missingData: [] });
    },
    async getDocumentVersion(documentId, versionId) {
      const version = Object.values(state.documents.versions).find(
        (item) => item.documentId === documentId && item.id === versionId,
      );
      return delay(version ?? null);
    },
    async connectIntegration(provider) {
      const integration = {
        provider,
        status: "CONNECTED",
        itemCount: provider === "GITHUB" ? 4 : 8,
        connectedAt: "2026-08-19T09:00:00Z",
      };
      state.integrations = state.integrations.map((item) => (
        item.provider === provider ? integration : item
      ));
      return delay({ integration });
    },
    async disconnectIntegration(provider) {
      const integration = {
        provider,
        status: "DISCONNECTED",
        itemCount: 0,
        accountLabel: null,
        connectedAt: null,
        errorCode: null,
      };
      state.integrations = state.integrations.map((item) => (
        item.provider === provider ? integration : item
      ));
      return delay({ integration });
    },
    async generateDocument(type) {
      const document = state.documents.summaries.find((item) => item.type === type);
      const versionNumber = (document?.versions.at(-1)?.versionNumber ?? 0) + 1;
      const documentId = document?.id ?? `doc-${type.toLowerCase()}`;
      const version = createVersion(documentId, type, versionNumber, new Date().toISOString());
      if (document) {
        document.latestVersionId = version.id;
        document.versions.push({ id: version.id, versionNumber, createdAt: version.createdAt });
      } else {
        state.documents.summaries.push({
          id: documentId,
          type,
          title: version.title,
          latestVersionId: version.id,
          versions: [{ id: version.id, versionNumber, createdAt: version.createdAt }],
        });
      }
      state.documents.versions[version.id] = version;
      const job = {
        id: `job-${type.toLowerCase()}-${versionNumber}`,
        status: "SUCCEEDED",
        documentId,
        versionId: version.id,
      };
      generationJobs.set(job.id, job);
      return delay(job);
    },
    async getDocumentGeneration(jobId) {
      return delay(generationJobs.get(jobId) ?? null);
    },
  };
}
