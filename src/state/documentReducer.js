// 문서 워크스페이스의 연결 범위·버전·조회 상태를 순수하게 관리한다.
export const DOCUMENT_TYPES = Object.freeze({
  PORTFOLIO: "PORTFOLIO",
  RESUME: "RESUME",
});

const DEFAULT_INTEGRATIONS = Object.freeze([
  { provider: "GITHUB", status: "DISCONNECTED", itemCount: 0 },
  { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
]);

const DEFAULT_AUTOMATION = Object.freeze({
  enabled: false,
  schedule: Object.freeze({ dayOfWeek: "MONDAY", time: "21:00", timezone: "Asia/Seoul" }),
});

export const initialDocumentState = {
  activeDocumentType: DOCUMENT_TYPES.PORTFOLIO,
  integrations: DEFAULT_INTEGRATIONS,
  documents: [],
  selectedDocumentId: null,
  selectedVersionId: null,
  selectedVersion: null,
  automation: DEFAULT_AUTOMATION,
  loadStatus: "IDLE",
  error: null,
  toast: null,
  dataNotice: null,
  missingData: [],
};

export function createInitialDocumentState(overrides = {}) {
  return {
    ...initialDocumentState,
    ...overrides,
    integrations: mergeIntegrations(overrides.integrations),
    documents: overrides.documents ?? [],
    automation: mergeAutomation(overrides.automation),
    missingData: overrides.missingData ?? [],
  };
}

function mergeIntegrations(integrations = []) {
  return DEFAULT_INTEGRATIONS.map((fallback) => ({
    ...fallback,
    ...integrations.find((integration) => integration.provider === fallback.provider),
  }));
}

function mergeAutomation(automation = {}) {
  return {
    ...DEFAULT_AUTOMATION,
    ...automation,
    schedule: {
      ...DEFAULT_AUTOMATION.schedule,
      ...(automation.schedule ?? {}),
    },
  };
}

function findDocumentByType(documents, type) {
  return documents.find((document) => document.type === type) ?? null;
}

function selectLatestVersion(state, documentType = state.activeDocumentType) {
  const document = findDocumentByType(state.documents, documentType);
  if (!document) {
    return {
      ...state,
      activeDocumentType: documentType,
      selectedDocumentId: null,
      selectedVersionId: null,
      selectedVersion: null,
    };
  }

  const version = document.versions.find((item) => item.id === document.latestVersionId) ?? document.versions.at(-1);
  return {
    ...state,
    activeDocumentType: documentType,
    selectedDocumentId: document.id,
    selectedVersionId: version?.id ?? null,
    selectedVersion: version?.markdown ? version : null,
  };
}

function replaceIntegration(integrations, integration) {
  return integrations.map((item) => (item.provider === integration.provider ? integration : item));
}

export function getConnectedIntegrations(state) {
  return state.integrations.filter((integration) => integration.status === "CONNECTED");
}

export function documentReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loadStatus: "LOADING", error: null };
    case "LOAD_SUCCESS":
      return selectLatestVersion(
        {
          ...state,
          integrations: action.integrations === undefined
            ? state.integrations
            : mergeIntegrations(action.integrations),
          documents: action.documents ?? state.documents,
          automation: action.automation === undefined
            ? state.automation
            : mergeAutomation(action.automation),
          dataNotice: action.dataNotice ?? null,
          missingData: action.missingData ?? [],
          loadStatus: "READY",
          error: null,
        },
        state.activeDocumentType,
      );
    case "LOAD_ERROR":
      return { ...state, loadStatus: "ERROR", error: action.error };
    case "SET_DOCUMENT_TYPE":
      return selectLatestVersion(state, action.documentType);
    case "SELECT_VERSION":
      return {
        ...state,
        activeDocumentType: action.documentType ?? state.activeDocumentType,
        selectedDocumentId: action.documentId,
        selectedVersionId: action.versionId,
        selectedVersion: action.version ?? null,
      };
    case "VERSION_LOADED":
      return { ...state, selectedVersion: action.version };
    case "INTEGRATION_UPDATED":
      return { ...state, integrations: replaceIntegration(state.integrations, action.integration) };
    case "AUTOMATION_UPDATED":
      return { ...state, automation: mergeAutomation(action.automation) };
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
