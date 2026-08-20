// 문서 조회 API와 reducer를 연결해 화면에 문서·연동 상태를 제공한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { getDocumentApi } from "../api/apiMode";
import { createInitialDocumentState, documentReducer, getConnectedIntegrations } from "./documentReducer";
import { pollGeneration } from "./generationPolling";

const defaultDocumentApi = getDocumentApi();
const DocumentContext = createContext(null);

function getLatestVersionId(document) {
  return document?.latestVersionId ?? document?.versions.at(-1)?.id ?? null;
}

export function DocumentProvider({ api = defaultDocumentApi, children, skipLoad = false }) {
  const [state, dispatch] = useReducer(documentReducer, undefined, createInitialDocumentState);
  const [pendingIntegrationProvider, setPendingIntegrationProvider] = useState(null);
  const [pendingDocumentType, setPendingDocumentType] = useState(null);

  const reload = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    const [integrationResult, documentResult] = await Promise.allSettled([
      api.listIntegrations(),
      api.listDocuments(),
    ]);
    if (integrationResult.status === "rejected" && documentResult.status === "rejected") {
      dispatch({ type: "LOAD_ERROR", error: documentResult.reason });
      return;
    }
    try {
      const documentData = documentResult.status === "fulfilled" ? documentResult.value : null;
      const missingData = [...(documentData?.missingData ?? [])];
      if (integrationResult.status === "rejected") {
        missingData.push("GitHub·Notion 연결 상태");
      }
      if (documentResult.status === "rejected") {
        missingData.push("문서 목록");
      }
      dispatch({
        type: "LOAD_SUCCESS",
        integrations: integrationResult.status === "fulfilled"
          ? integrationResult.value.integrations ?? []
          : undefined,
        documents: documentData?.documents,
        dataNotice: documentData?.dataNotice
          ?? (missingData.length > 0 ? "PARTIAL_DATA" : null),
        missingData,
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
    const handleOAuthResult = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== "blocki:oauth-complete") {
        return;
      }
      if (event.data.result === "success") {
        reload();
        dispatch({ type: "SET_TOAST", message: `${event.data.provider === "GITHUB" ? "GitHub" : "Notion"} 연결을 확인했어요.` });
      } else {
        dispatch({ type: "SET_TOAST", message: "연결을 완료하지 못했어요. 다시 시도해주세요." });
      }
    };
    window.addEventListener("message", handleOAuthResult);
    return () => window.removeEventListener("message", handleOAuthResult);
  }, [reload]);

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
    setPendingIntegrationProvider(provider);
    try {
      const result = await api.connectIntegration(provider);
      if (!result?.integration) {
        dispatch({ type: "SET_TOAST", message: `${provider === "GITHUB" ? "GitHub" : "Notion"} 로그인 창을 열었어요.` });
        return result;
      }
      dispatch({ type: "INTEGRATION_UPDATED", integration: result.integration });
      dispatch({ type: "SET_TOAST", message: `${provider === "GITHUB" ? "GitHub" : "Notion"}을 연결했어요.` });
      return result;
    } catch (error) {
      dispatch({ type: "SET_TOAST", message: "연결 상태를 바꾸지 못했어요. 다시 시도해주세요." });
      throw error;
    } finally {
      setPendingIntegrationProvider(null);
    }
  }, [api]);

  const disconnectIntegration = useCallback(async (provider) => {
    setPendingIntegrationProvider(provider);
    try {
      const result = await api.disconnectIntegration(provider);
      dispatch({ type: "INTEGRATION_UPDATED", integration: result.integration });
      dispatch({ type: "SET_TOAST", message: `${provider === "GITHUB" ? "GitHub" : "Notion"} 연결을 해제했어요.` });
      return result;
    } catch {
      dispatch({ type: "SET_TOAST", message: "연결을 해제하지 못했어요. 다시 시도해주세요." });
      return null;
    } finally {
      setPendingIntegrationProvider(null);
    }
  }, [api]);

  const generateDocument = useCallback(async (documentType) => {
    setPendingDocumentType(documentType);
    setDocumentType(documentType);
    try {
      const queued = await api.generateDocument(documentType);
      const result = await pollGeneration(queued.id, {
        getGeneration: api.getDocumentGeneration,
      });
      if (!["SUCCEEDED", "PARTIALLY_SUCCEEDED"].includes(result.status)) {
        throw Object.assign(new Error("문서를 생성하지 못했어요. 다시 시도해주세요."), {
          code: result.errorCode ?? "DOCUMENT_GENERATION_FAILED",
        });
      }
      await reload();
      dispatch({
        type: "SET_TOAST",
        message: result.status === "PARTIALLY_SUCCEEDED"
          ? "문서를 생성했지만 일부 데이터가 누락됐어요."
          : `${documentType === "RESUME" ? "이력서" : "포트폴리오"}를 생성했어요.`,
      });
      return result;
    } catch (error) {
      dispatch({ type: "SET_TOAST", message: error.message ?? "문서를 생성하지 못했어요. 다시 시도해주세요." });
      return null;
    } finally {
      setPendingDocumentType(null);
    }
  }, [api, reload, setDocumentType]);

  const value = useMemo(() => ({
    ...state,
    connectedIntegrations: getConnectedIntegrations(state),
    connectedCount: getConnectedIntegrations(state).length,
    setDocumentType,
    selectVersion,
    connectIntegration,
    disconnectIntegration,
    pendingIntegrationProvider,
    generateDocument,
    pendingDocumentType,
    reload,
    clearToast,
    getLatestVersionId,
  }), [state, setDocumentType, selectVersion, connectIntegration, disconnectIntegration, pendingIntegrationProvider, generateDocument, pendingDocumentType, reload, clearToast]);

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocumentWorkspace() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocumentWorkspace must be used within DocumentProvider");
  }
  return context;
}
