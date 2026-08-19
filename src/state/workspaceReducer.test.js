// 워크스페이스의 세션·탭·일정 상태 전이를 검증한다.
import { describe, expect, it } from "vitest";
import {
  createInitialWorkspaceState,
  workspaceReducer,
} from "./workspaceReducer";

describe("workspaceReducer", () => {
  it("changes selected session without losing the current view state", () => {
    const state = createInitialWorkspaceState({ selectedSessionId: "session-1" });
    const next = workspaceReducer(state, { type: "SELECT_SESSION", sessionId: "session-2" });

    expect(next.selectedSessionId).toBe("session-2");
    expect(next.view).toBe(state.view);
    expect(next.chatMessages).toEqual([]);
  });

  it("switches to storage and opens the month overlay independently", () => {
    const state = createInitialWorkspaceState();
    const storageState = workspaceReducer(state, { type: "SET_VIEW", view: "STORAGE" });
    const overlayState = workspaceReducer(storageState, { type: "OPEN_MONTH_OVERLAY" });

    expect(overlayState.view).toBe("STORAGE");
    expect(overlayState.monthOverlayOpen).toBe(true);
  });

  it("moves a block from calendar items into storage", () => {
    const state = createInitialWorkspaceState({
      calendarItems: [{ occurrenceId: "occ-1", blockId: "block-1" }],
      storedBlocks: [],
    });
    const next = workspaceReducer(state, {
      type: "MOVE_BLOCK_TO_STORAGE",
      item: { occurrenceId: "occ-1", blockId: "block-1" },
    });

    expect(next.calendarItems).toEqual([]);
    expect(next.storedBlocks[0].source).toBe("STORAGE");
  });
});
