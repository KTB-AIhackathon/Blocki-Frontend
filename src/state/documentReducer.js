// 문서 워크스페이스의 연결 범위·버전·조회 상태를 순수하게 관리한다.
export const DOCUMENT_TYPES = Object.freeze({
  PORTFOLIO: "PORTFOLIO",
  RESUME: "RESUME",
});

export const initialDocumentState = {
  activeDocumentType: DOCUMENT_TYPES.PORTFOLIO,
  integrations: [],
  documents: [],
  selectedDocumentId: null,
  selectedVersionId: null,
  selectedVersion: null,
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
    integrations: overrides.integrations ?? [],
    documents: overrides.documents ?? [],
    missingData: overrides.missingData ?? [],
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
          integrations: action.integrations ?? state.integrations,
          documents: action.documents ?? state.documents,
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
      return selectLatestVersion({ ...state, dataNotice: null, missingData: [] }, action.documentType);
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
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
