// 일정 블록 드래그 시작 시 양방향 이동에 필요한 payload를 만드는지 검증한다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CalendarBlock from "./CalendarBlock";
import { BLOCK_DRAG_MIME, parseDragPayload } from "../../domain/calendar/dragPayload";
import AuthModal from "../auth/AuthModal";
import { AuthProvider } from "../../state/AuthContext";
import { WorkspaceProvider, useWorkspace } from "../../state/WorkspaceContext";
import { createInitialWorkspaceState } from "../../state/workspaceReducer";

function DropHarness() {
  const {
    calendarItems,
    storedBlocks,
    moveBlockToStorage,
    moveBlockOnDrop,
  } = useWorkspace();
  const calendarItem = calendarItems[0];
  const storedBlock = storedBlocks[0];

  return (
    <div>
      <button type="button" onClick={() => calendarItem && moveBlockToStorage(calendarItem)}>
        달력에서 보관
      </button>
      <button
        type="button"
        onClick={() => calendarItem && moveBlockOnDrop({
          payload: { blockId: calendarItem.blockId, source: "CALENDAR" },
          dropDate: "2026-08-20",
          dropMinutes: 10 * 60 + 14,
        })}
      >
        달력 내 이동
      </button>
      <button
        type="button"
        onClick={() => storedBlock && moveBlockOnDrop({
          payload: { blockId: storedBlock.blockId, source: "STORAGE" },
          dropDate: "2026-08-20",
          dropMinutes: 10 * 60 + 14,
        })}
      >
        보관함에서 복원
      </button>
      <output data-testid="calendar-count">{calendarItems.length}</output>
      <output data-testid="storage-count">{storedBlocks.length}</output>
      <output data-testid="first-start">{calendarItems[0]?.startAt ?? "none"}</output>
    </div>
  );
}

function renderDropHarness({ api, initialUser = null }) {
  const item = {
    occurrenceId: "occ-1",
    blockId: "block-1",
    workflowId: "workflow-1",
    name: "서버 상태 점검",
    startAt: "2026-08-18T09:00:00+09:00",
    endAt: "2026-08-18T10:30:00+09:00",
    source: "CALENDAR",
  };
  const stored = { ...item, occurrenceId: "stored-1", blockId: "block-2", source: "STORAGE" };
  const state = createInitialWorkspaceState({
    calendarItems: [item],
    storedBlocks: [stored],
    workflow: { id: "workflow-1", revision: 4 },
    revision: 4,
  });
  render(
    <AuthProvider api={api} initialUser={initialUser} skipBootstrap>
      <WorkspaceProvider api={api} initialState={state} skipLoad>
        <DropHarness />
        <AuthModal />
      </WorkspaceProvider>
    </AuthProvider>,
  );
}

describe("calendar drag and drop", () => {
  it("writes a serializable calendar payload on drag start", () => {
    const data = new Map();
    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn((type, value) => data.set(type, value)),
    };
    render(
      <CalendarBlock
        group={{
          visibleItem: {
            occurrenceId: "occ-1",
            blockId: "block-1",
            name: "서버 상태 점검",
            startAt: "2026-08-18T09:00:00+09:00",
          },
          items: [],
          hiddenCount: 0,
        }}
        selected={false}
        onSelect={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    fireEvent.dragStart(screen.getByRole("button", { name: /서버 상태 점검/ }), { dataTransfer });

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(parseDragPayload(data.get(BLOCK_DRAG_MIME))).toMatchObject({
      occurrenceId: "occ-1",
      blockId: "block-1",
      source: "CALENDAR",
    });
  });

  it("moves blocks in both directions while preserving the duration for an authenticated user", async () => {
    const user = { id: "user-1", email: "demo@example.com" };
    const api = { mode: "mock" };
    renderDropHarness({ api, initialUser: user });

    fireEvent.click(screen.getByRole("button", { name: "달력에서 보관" }));
    expect(screen.getByTestId("calendar-count")).toHaveTextContent("0");
    expect(screen.getByTestId("storage-count")).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("button", { name: "보관함에서 복원" }));
    await waitFor(() => expect(screen.getByTestId("first-start")).toHaveTextContent("2026-08-20T10:00:00+09:00"));
  });

  it("opens the login modal instead of mutating when a guest drops a block", () => {
    renderDropHarness({ api: { mode: "mock" } });

    fireEvent.click(screen.getByRole("button", { name: "달력에서 보관" }));

    expect(screen.getByRole("dialog", { name: "Blocki 로그인" })).toBeInTheDocument();
    expect(screen.getByTestId("calendar-count")).toHaveTextContent("1");
  });

  it("rolls back the optimistic schedule when the API reports a revision conflict", async () => {
    const user = userEvent.setup();
    const api = {
      mode: "api",
      moveBlock: vi.fn().mockRejectedValue({ code: "WORKFLOW_REVISION_CONFLICT" }),
    };
    renderDropHarness({ api, initialUser: { id: "user-1" } });

    await user.click(screen.getByRole("button", { name: "달력 내 이동" }));

    await waitFor(() => expect(screen.getByTestId("first-start")).toHaveTextContent("2026-08-18T09:00:00+09:00"));
  });
});
