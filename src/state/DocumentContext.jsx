// 문서 조회 API와 reducer를 연결해 화면에 문서·연동 상태를 제공한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { getDocumentApi } from "../api/apiMode";
import { createInitialDocumentState, documentReducer, getConnectedIntegrations } from "./documentReducer";

const defaultDocumentApi = getDocumentApi();
const DocumentContext = createContext(null);

function getLatestVersionId(document) {
  return document?.latestVersionId ?? document?.versions.at(-1)?.id ?? null;
}

export function DocumentProvider({ api = defaultDocumentApi, children, skipLoad = false }) {
  const [state, dispatch] = useReducer(documentReducer, undefined, createInitialDocumentState);

  const reload = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const [integrationResult, documentResult] = await Promise.all([
        api.listIntegrations(),
        api.listDocuments(),
      ]);
      dispatch({
        type: "LOAD_SUCCESS",
        integrations: integrationResult.integrations ?? [],
        documents: documentResult.documents ?? [],
        dataNotice: documentResult.dataNotice ?? null,
        missingData: documentResult.missingData ?? [],
      });
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error });
    }
  }, [api]);

  useEffect(() => {
    if (!skipLoad) {
      reload();
    }
  }, [reload, skipLoad]);

  useEffect(() => {
    if (!state.selectedDocumentId || !state.selectedVersionId || state.selectedVersion?.id === state.selectedVersionId) {
      return undefined;
    }

    let active = true;
    api.getDocumentVersion(state.selectedDocumentId, state.selectedVersionId)
      .then((version) => {
        if (active && version) {
          dispatch({ type: "VERSION_LOADED", version });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [api, state.selectedDocumentId, state.selectedVersionId, state.selectedVersion?.id]);

  const setDocumentType = useCallback((documentType) => dispatch({ type: "SET_DOCUMENT_TYPE", documentType }), []);
  const clearToast = useCallback(() => dispatch({ type: "CLEAR_TOAST" }), []);

  const selectVersion = useCallback((document, version) => {
    dispatch({
      type: "SELECT_VERSION",
      documentId: document.id,
      documentType: document.type,
      versionId: version.id,
      version: version.markdown ? version : null,
    });
  }, []);

  const connectIntegration = useCallback(async (provider) => {
    try {
      const result = await api.connectIntegration(provider);
      if (!result?.integration) {
        dispatch({ type: "SET_TOAST", message: `${provider === "GITHUB" ? "GitHub" : "Notion"} 인증 화면으로 이동합니다.` });
        return result;
      }
      dispatch({ type: "INTEGRATION_UPDATED", integration: result.integration });
      dispatch({ type: "SET_TOAST", message: `${provider === "GITHUB" ? "GitHub" : "Notion"}을 연결했어요.` });
      return result;
    } catch (error) {
      dispatch({ type: "SET_TOAST", message: "연결 상태를 바꾸지 못했어요. 다시 시도해주세요." });
      throw error;
    }
  }, [api]);

  const value = useMemo(() => ({
    ...state,
    connectedIntegrations: getConnectedIntegrations(state),
    connectedCount: getConnectedIntegrations(state).length,
    setDocumentType,
    selectVersion,
    connectIntegration,
    reload,
    clearToast,
    getLatestVersionId,
  }), [state, setDocumentType, selectVersion, connectIntegration, reload, clearToast]);

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocumentWorkspace() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocumentWorkspace must be used within DocumentProvider");
  }
  return context;
}
