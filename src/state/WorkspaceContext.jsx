// workspace reducer와 API adapter를 연결해 달력·세션 명령을 제공한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { getMondayWeekStart } from "../domain/calendar/dateUtils";
import { calculateDropSchedule } from "../domain/calendar/dragPayload";
import { createIdempotencyKey } from "../api/apiClient";
import { getAppApi } from "../api/apiMode";
import { pollGeneration } from "./generationPolling";
import { useAuth } from "./AuthContext";
import { createInitialWorkspaceState, workspaceReducer } from "./workspaceReducer";

const WorkspaceContext = createContext(null);

function unwrapList(result, key) {
  return result?.[key] ?? result?.items ?? result ?? [];
}

export function WorkspaceProvider({ api = getAppApi(), children, initialState, skipLoad = false }) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialState ?? createInitialWorkspaceState(),
  );
  const { isAuthenticated, openLogin } = useAuth();

  const loadSession = useCallback(
    async (sessionId, weekStart = state.weekStart) => {
      const [messagesResult, workflowResult, calendarResult] = await Promise.all([
        api.listMessages?.(sessionId) ?? { messages: [] },
        api.getWorkflow?.(sessionId) ?? null,
        api.getCalendar?.(sessionId, { weekStart, zoneId: "Asia/Seoul" }) ?? {
          items: [],
          storedBlocks: [],
          revision: state.revision,
        },
      ]);
      dispatch({
        type: "SET_SESSION_DATA",
        messages: unwrapList(messagesResult, "messages"),
        workflow: workflowResult,
      });
      dispatch({
        type: "SET_CALENDAR",
        items: calendarResult?.items,
        storedBlocks: calendarResult?.storedBlocks,
        revision: calendarResult?.revision,
      });
    },
    [api, state.revision, state.weekStart],
  );

  useEffect(() => {
    if (skipLoad || !api.listSessions) {
      return;
    }

    api.listSessions({ limit: 20 })
      .then((result) => {
        const sessions = unwrapList(result, "sessions");
        if (sessions.length === 0) {
          return;
        }
        dispatch({ type: "SET_SESSIONS", sessions });
        const selectedId = sessions.some((session) => session.id === state.selectedSessionId)
          ? state.selectedSessionId
          : sessions[0].id;
        dispatch({ type: "SELECT_SESSION", sessionId: selectedId });
        return loadSession(selectedId);
      })
      .catch(() => {
        dispatch({ type: "SET_TOAST", message: "워크스페이스 데이터를 불러오지 못했어요." });
      });
  }, [api, loadSession, skipLoad, state.selectedSessionId]);

  const selectSession = useCallback(
    async (sessionId) => {
      dispatch({ type: "SELECT_SESSION", sessionId });
      await loadSession(sessionId);
    },
    [loadSession],
  );

  const setView = useCallback((view) => dispatch({ type: "SET_VIEW", view }), []);
  const openMonthOverlay = useCallback(() => dispatch({ type: "OPEN_MONTH_OVERLAY" }), []);
  const closeMonthOverlay = useCallback(() => dispatch({ type: "CLOSE_MONTH_OVERLAY" }), []);
  const selectOccurrence = useCallback(
    (occurrenceId) => dispatch({ type: "SELECT_OCCURRENCE", occurrenceId }),
    [],
  );
  const closeDetail = useCallback(() => dispatch({ type: "CLOSE_DETAIL" }), []);
  const setToast = useCallback((message) => dispatch({ type: "SET_TOAST", message }), []);
  const clearToast = useCallback(() => dispatch({ type: "CLEAR_TOAST" }), []);

  const pollAndStoreGeneration = useCallback(
    async (generation, sessionId) => {
      if (!generation?.id || !api.getGeneration) {
        return generation;
      }
      try {
        const result = await pollGeneration(generation.id, {
          getGeneration: api.getGeneration,
        });
        dispatch({ type: "SET_GENERATION", generation: result });
        if (result.assistantMessage) {
          dispatch({
            type: "APPEND_MESSAGE",
            message: {
              id: `assistant-${result.id}`,
              role: "ASSISTANT",
              content: result.assistantMessage,
              createdAt: new Date().toISOString(),
              generationStatus: result.status,
            },
          });
        } else if (sessionId && api.listMessages) {
          const messagesResult = await api.listMessages(sessionId);
          dispatch({
            type: "SET_SESSION_DATA",
            messages: unwrapList(messagesResult, "messages"),
          });
        }
        return result;
      } catch (error) {
        const failed = {
          ...generation,
          status: "FAILED",
          errorMessage: error.message ?? "생성에 실패했어요.",
          code: error.code,
        };
        dispatch({ type: "SET_GENERATION", generation: failed });
        return failed;
      }
    },
    [api],
  );

  const sendMessage = useCallback(
    async (content) => {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return false;
      }
      if (!isAuthenticated) {
        openLogin("AI 채팅");
        return false;
      }
      const clientMessageId = createIdempotencyKey();
      const idempotencyKey = createIdempotencyKey();
      const payload = {
        content: trimmedContent,
        clientMessageId,
        idempotencyKey,
        zoneId: "Asia/Seoul",
      };
      let result;
      try {
        result = state.selectedSessionId && api.sendMessage
          ? await api.sendMessage(state.selectedSessionId, payload)
          : await api.createSession?.(payload);
      } catch (error) {
        dispatch({
          type: "SET_GENERATION",
          generation: { status: "FAILED", errorMessage: error.message ?? "메시지를 보내지 못했어요." },
        });
        return false;
      }
      if (!result) {
        return false;
      }
      if (result.session) {
        dispatch({ type: "ADD_SESSION", session: result.session });
      }
      dispatch({
        type: "APPEND_MESSAGE",
        message: result.message ?? {
          id: `message-${clientMessageId}`,
          role: "USER",
          content: trimmedContent,
          createdAt: new Date().toISOString(),
        },
      });
      dispatch({ type: "SET_GENERATION", generation: result.generation ?? null });
      await pollAndStoreGeneration(result.generation, result.session?.id ?? state.selectedSessionId);
      return true;
    },
    [api, isAuthenticated, openLogin, pollAndStoreGeneration, state.selectedSessionId],
  );

  const retryGeneration = useCallback(async () => {
    if (state.generation?.status !== "FAILED" || !api.retryGeneration || !isAuthenticated) {
      return false;
    }
    const generation = await api.retryGeneration(state.generation.id, createIdempotencyKey());
    dispatch({ type: "SET_GENERATION", generation });
    await pollAndStoreGeneration(generation, state.selectedSessionId);
    return true;
  }, [api, isAuthenticated, pollAndStoreGeneration, state.generation, state.selectedSessionId]);

  const moveBlockToStorage = useCallback(
    (item) => {
      if (!isAuthenticated) {
        openLogin("블록 보관");
        return false;
      }
      dispatch({ type: "MOVE_BLOCK_TO_STORAGE", item });
      return true;
    },
    [isAuthenticated, openLogin],
  );

  const moveBlockToCalendar = useCallback(
    async ({ item, dropDate, dropMinutes }) => {
      if (!isAuthenticated) {
        openLogin("일정 이동");
        return false;
      }
      const schedule = calculateDropSchedule({
        dropDate,
        dropMinutes,
        startAt: item.startAt,
        endAt: item.endAt,
      });
      const previous = {
        items: state.calendarItems,
        storedBlocks: state.storedBlocks,
        revision: state.revision,
      };
      if (item.source === "STORAGE") {
        dispatch({ type: "RESTORE_BLOCK", item, ...schedule });
        return true;
      }
      dispatch({ type: "MOVE_BLOCK_LOCAL", blockId: item.blockId, ...schedule });
      if (!api.moveBlock) {
        return true;
      }
      try {
        const result = await api.moveBlock({
          workflowId: item.workflowId ?? state.workflow?.id,
          blockId: item.blockId,
          ...schedule,
          revision: state.revision,
        });
        dispatch({
          type: "MOVE_BLOCK_LOCAL",
          blockId: item.blockId,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
          revision: result?.revision,
        });
      } catch {
        dispatch({ type: "SET_CALENDAR", ...previous });
        dispatch({ type: "SET_TOAST", message: "다른 변경이 먼저 반영되어 일정을 되돌렸어요." });
        return false;
      }
      return true;
    },
    [api, isAuthenticated, openLogin, state],
  );

  const moveBlockOnDrop = useCallback(
    async ({ payload, dropDate, dropMinutes }) => {
      const item = [...state.calendarItems, ...state.storedBlocks].find(
        (candidate) => candidate.blockId === payload.blockId,
      );
      if (!item) {
        return false;
      }
      return moveBlockToCalendar({ item, dropDate, dropMinutes });
    },
    [moveBlockToCalendar, state.calendarItems, state.storedBlocks],
  );

  const openDetail = useCallback(
    async (items) => {
      const relatedItems = items ?? [];
      const firstItem = relatedItems[0];
      if (!firstItem) {
        return;
      }
      const fallback = { detail: firstItem, relatedItems };
      dispatch({ type: "OPEN_DETAIL", detail: fallback });
      if (!api.getBlockDetail) {
        return;
      }
      try {
        const detail = await api.getBlockDetail(
          firstItem.workflowId ?? state.workflow?.id,
          firstItem.blockId,
        );
        dispatch({ type: "OPEN_DETAIL", detail: { detail, relatedItems } });
      } catch {
        dispatch({ type: "OPEN_DETAIL", detail: fallback });
      }
    },
    [api, state.workflow],
  );

  const setWeek = useCallback(
    async (weekStart) => {
      const normalizedWeekStart = getMondayWeekStart(weekStart);
      dispatch({ type: "SET_WEEK", weekStart: normalizedWeekStart });
      if (state.selectedSessionId && api.getCalendar) {
        const calendar = await api.getCalendar(state.selectedSessionId, {
          weekStart: normalizedWeekStart,
          zoneId: "Asia/Seoul",
        });
        dispatch({ type: "SET_CALENDAR", ...calendar });
      }
    },
    [api, state.selectedSessionId],
  );

  const requireAuthentication = useCallback(
    (action) => {
      if (!isAuthenticated) {
        openLogin("변경 작업");
        return false;
      }
      return action ? action() : true;
    },
    [isAuthenticated, openLogin],
  );

  const value = useMemo(
    () => ({
      ...state,
      selectSession,
      setView,
      setWeek,
      openMonthOverlay,
      closeMonthOverlay,
      selectOccurrence,
      openDetail,
      closeDetail,
      moveBlockToStorage,
      moveBlockToCalendar,
      moveBlockOnDrop,
      sendMessage,
      retryGeneration,
      setToast,
      clearToast,
      requireAuthentication,
      canMutate: isAuthenticated,
      dispatch,
    }),
    [
      state,
      selectSession,
      setView,
      setWeek,
      openMonthOverlay,
      closeMonthOverlay,
      selectOccurrence,
      openDetail,
      closeDetail,
      moveBlockToStorage,
      moveBlockToCalendar,
      moveBlockOnDrop,
      sendMessage,
      retryGeneration,
      setToast,
      clearToast,
      requireAuthentication,
      isAuthenticated,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
