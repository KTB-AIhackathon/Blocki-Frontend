// 문서 조회 API와 reducer를 연결해 화면에 문서·연동 상태를 제공한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { getDocumentApi } from "../api/apiMode";
import { createInitialDocumentState, documentReducer, getConnectedIntegrations } from "./documentReducer";
import { pollGeneration } from "./generationPolling";

const defaultDocumentApi = getDocumentApi();
const DocumentContext = createContext(null);
const INTEGRATION_PROVIDERS = ["GITHUB", "NOTION"];

function getDisconnectedData(integrations = []) {
  return INTEGRATION_PROVIDERS
    .filter((provider) => integrations.find((integration) => integration.provider === provider)?.status !== "CONNECTED")
    .map((provider) => ({ provider, reason: "연결되지 않음" }));
}

function mergeMissingData(missingData, additionalData) {
  const existingProviders = new Set(
    missingData
      .filter((item) => item && typeof item === "object")
      .map((item) => item.provider),
  );
  return [
    ...missingData,
    ...additionalData.filter((item) => !existingProviders.has(item.provider)),
  ];
}

function getLatestVersionId(document) {
  return document?.latestVersionId ?? document?.versions.at(-1)?.id ?? null;
}

export function DocumentProvider({ api = defaultDocumentApi, children, skipLoad = false }) {
  const [state, dispatch] = useReducer(documentReducer, undefined, createInitialDocumentState);
  const [pendingIntegrationProvider, setPendingIntegrationProvider] = useState(null);
  const [pendingDocumentType, setPendingDocumentType] = useState(null);
  const [pendingAutomation, setPendingAutomation] = useState(false);

  const reload = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    const automationRequest = typeof api.getDocumentGenerationAutomation === "function"
      ? api.getDocumentGenerationAutomation()
      : Promise.resolve(null);
    const [integrationResult, documentResult, automationResult] = await Promise.allSettled([
      api.listIntegrations(),
      api.listDocuments(),
      automationRequest,
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
        automation: automationResult.status === "fulfilled" ? automationResult.value ?? undefined : undefined,
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
      let automationRefreshFailed = false;
      if (provider === "GITHUB" && typeof api.getDocumentGenerationAutomation === "function") {
        try {
          const automation = await api.getDocumentGenerationAutomation();
          dispatch({ type: "AUTOMATION_UPDATED", automation });
        } catch {
          automationRefreshFailed = true;
        }
      }
      dispatch({
        type: "SET_TOAST",
        message: automationRefreshFailed
          ? "GitHub 연결 해제 후 자동화 상태를 확인하지 못했어요."
          : `${provider === "GITHUB" ? "GitHub" : "Notion"} 연결을 해제했어요.`,
      });
      return result;
    } catch {
      dispatch({ type: "SET_TOAST", message: "연결을 해제하지 못했어요. 다시 시도해주세요." });
      return null;
    } finally {
      setPendingIntegrationProvider(null);
    }
  }, [api]);

  const changeIntegration = useCallback(async (provider) => {
    if (typeof api.changeIntegration !== "function") {
      return null;
    }
    setPendingIntegrationProvider(provider);
    try {
      const result = await api.changeIntegration(provider);
      if (result?.integration) {
        dispatch({ type: "INTEGRATION_UPDATED", integration: result.integration });
      }
      dispatch({
        type: "SET_TOAST",
        message: provider === "GITHUB"
          ? "GitHub 계정 선택 창을 열었어요."
          : "Notion 인증 창을 열었어요. 같은 계정이 선택되면 Notion에서 로그아웃한 뒤 다시 시도해주세요.",
      });
      return result;
    } catch {
      await reload();
      dispatch({ type: "SET_TOAST", message: "계정 변경을 시작하지 못했어요. 다시 시도해주세요." });
      return null;
    } finally {
      setPendingIntegrationProvider(null);
    }
  }, [api, reload]);

  const updateDocumentGenerationAutomation = useCallback(async (enabled) => {
    if (typeof api.updateDocumentGenerationAutomation !== "function") {
      return null;
    }
    setPendingAutomation(true);
    try {
      const automation = await api.updateDocumentGenerationAutomation(enabled);
      dispatch({ type: "AUTOMATION_UPDATED", automation });
      dispatch({ type: "SET_TOAST", message: enabled ? "문서 자동화를 켰어요." : "문서 자동화를 껐어요." });
      return automation;
    } catch (error) {
      dispatch({
        type: "SET_TOAST",
        message: error.code === "GITHUB_INTEGRATION_REQUIRED"
          ? error.message
          : "문서 자동화 설정을 바꾸지 못했어요. 다시 시도해주세요.",
      });
      return null;
    } finally {
      setPendingAutomation(false);
    }
  }, [api]);

  const downloadDocumentVersionPdf = useCallback(async (documentId, versionId) => {
    if (typeof api.downloadDocumentVersionPdf !== "function") {
      dispatch({ type: "SET_TOAST", message: "PDF 다운로드 API가 연결되지 않았어요." });
      return null;
    }
    try {
      return await api.downloadDocumentVersionPdf(documentId, versionId);
    } catch (error) {
      dispatch({ type: "SET_TOAST", message: error.message ?? "PDF를 다운로드하지 못했어요." });
      return null;
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

  const dataNoticeView = useMemo(() => {
    const disconnectedData = state.loadStatus === "READY" ? getDisconnectedData(state.integrations) : [];
    const disconnectedProviders = new Set(disconnectedData.map((item) => item.provider));
    const displayMissingData = mergeMissingData(state.missingData, disconnectedData);
    const displayDataNotice = disconnectedData.length > 0 ? "PARTIAL_DATA" : state.dataNotice;
    const canRetryDataNotice = displayDataNotice === "PARTIAL_DATA"
      && (displayMissingData.length === 0
        || displayMissingData.some((item) => typeof item === "string" || !disconnectedProviders.has(item.provider)));

    return { displayDataNotice, displayMissingData, canRetryDataNotice };
  }, [state]);

  const value = useMemo(() => ({
    ...state,
    dataNotice: dataNoticeView.displayDataNotice,
    missingData: dataNoticeView.displayMissingData,
    canRetryDataNotice: dataNoticeView.canRetryDataNotice,
    connectedIntegrations: getConnectedIntegrations(state),
    connectedCount: getConnectedIntegrations(state).length,
    setDocumentType,
    selectVersion,
    connectIntegration,
    disconnectIntegration,
    changeIntegration,
    pendingIntegrationProvider,
    generateDocument,
    pendingDocumentType,
    pendingAutomation,
    updateDocumentGenerationAutomation,
    downloadDocumentVersionPdf,
    reload,
    clearToast,
    getLatestVersionId,
  }), [state, dataNoticeView, setDocumentType, selectVersion, connectIntegration, disconnectIntegration, changeIntegration, pendingIntegrationProvider, generateDocument, pendingDocumentType, pendingAutomation, updateDocumentGenerationAutomation, downloadDocumentVersionPdf, reload, clearToast]);

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocumentWorkspace() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocumentWorkspace must be used within DocumentProvider");
  }
  return context;
}
