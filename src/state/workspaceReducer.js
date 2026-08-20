// 세션·달력·보관함·채팅 화면의 상태 전이를 순수 reducer로 관리한다.
import { getMondayWeekStart } from "../domain/calendar/dateUtils";

export function createInitialWorkspaceState(overrides = {}) {
  return {
    sessions: [],
    selectedSessionId: null,
    view: "ALL_AUTOMATIONS",
    weekStart: getMondayWeekStart(new Date()),
    calendarItems: [],
    storedBlocks: [],
    workflow: null,
    revision: 0,
    selectedOccurrenceId: null,
    detailTarget: null,
    monthOverlayOpen: false,
    chatMessages: [],
    generation: null,
    toast: null,
    ...overrides,
  };
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };
    case "ADD_SESSION":
      return {
        ...state,
        sessions: [action.session, ...state.sessions.filter((session) => session.id !== action.session.id)],
        selectedSessionId: action.session.id,
      };
    case "SELECT_SESSION":
      return {
        ...state,
        selectedSessionId: action.sessionId,
        selectedOccurrenceId: null,
        detailTarget: null,
        chatMessages: [],
        generation: null,
      };
    case "SET_SESSION_DATA":
      return {
        ...state,
        chatMessages: action.messages ?? state.chatMessages,
        workflow: action.workflow ?? state.workflow,
      };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_WEEK":
      return { ...state, weekStart: action.weekStart, selectedOccurrenceId: null };
    case "SET_CALENDAR":
      return {
        ...state,
        calendarItems: action.items ?? [],
        storedBlocks: action.storedBlocks ?? state.storedBlocks,
        revision: action.revision ?? state.revision,
      };
    case "OPEN_MONTH_OVERLAY":
      return { ...state, monthOverlayOpen: true };
    case "CLOSE_MONTH_OVERLAY":
      return { ...state, monthOverlayOpen: false };
    case "SELECT_OCCURRENCE":
      return { ...state, selectedOccurrenceId: action.occurrenceId };
    case "OPEN_DETAIL":
      return { ...state, detailTarget: action.detail };
    case "CLOSE_DETAIL":
      return { ...state, detailTarget: null };
    case "MOVE_BLOCK_LOCAL":
      return {
        ...state,
        calendarItems: state.calendarItems.map((item) =>
          item.blockId === action.blockId
            ? { ...item, startAt: action.startAt, endAt: action.endAt, source: "CALENDAR" }
            : item,
        ),
        revision: action.revision ?? state.revision,
      };
    case "MOVE_BLOCK_TO_STORAGE":
      return {
        ...state,
        calendarItems: state.calendarItems.filter((item) => item.blockId !== action.item.blockId),
        storedBlocks: [
          ...state.storedBlocks.filter((item) => item.blockId !== action.item.blockId),
          { ...action.item, source: "STORAGE" },
        ],
      };
    case "RESTORE_BLOCK":
      return {
        ...state,
        storedBlocks: state.storedBlocks.filter((item) => item.blockId !== action.item.blockId),
        calendarItems: [
          ...state.calendarItems.filter((item) => item.blockId !== action.item.blockId),
          { ...action.item, startAt: action.startAt, endAt: action.endAt, source: "CALENDAR" },
        ],
      };
    case "APPEND_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };
    case "SET_GENERATION":
      return { ...state, generation: action.generation };
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
