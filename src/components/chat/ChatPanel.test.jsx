// 채팅 입력·첫 세션 생성·기존 메시지·실패 재시도를 검증한다.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChatPanel from "./ChatPanel";
import AuthModal from "../auth/AuthModal";
import { AuthProvider } from "../../state/AuthContext";
import { WorkspaceProvider } from "../../state/WorkspaceContext";
import { createInitialWorkspaceState } from "../../state/workspaceReducer";

function renderChat({ api, initialUser = null, initialState }) {
  render(
    <AuthProvider api={api} initialUser={initialUser} skipBootstrap>
      <WorkspaceProvider api={api} initialState={initialState} skipLoad>
        <ChatPanel />
        <AuthModal />
      </WorkspaceProvider>
    </AuthProvider>,
  );
}

function queuedGeneration(id = "generation-1") {
  return { id, status: "QUEUED" };
}

describe("ChatPanel", () => {
  it("creates a session for the first message and polls the generation", async () => {
    const user = userEvent.setup();
    const api = {
      createSession: vi.fn().mockResolvedValue({
        session: { id: "session-new", title: "새 자동화" },
        message: { id: "message-new", role: "USER", content: "매일 오전 9시에 메일 보내줘" },
        generation: queuedGeneration(),
      }),
      getGeneration: vi.fn().mockResolvedValue({
        id: "generation-1",
        status: "SUCCEEDED",
        assistantMessage: "일정을 추가했어요.",
      }),
    };
    const initialState = createInitialWorkspaceState({
      sessions: [],
      selectedSessionId: null,
      chatMessages: [],
    });
    renderChat({ api, initialState, initialUser: { id: "user-1" } });

    await user.type(screen.getByRole("textbox", { name: "자동화 요청" }), "매일 오전 9시에 메일 보내줘");
    await user.click(screen.getByRole("button", { name: "보내기" }));

    await waitFor(() => expect(api.createSession).toHaveBeenCalledWith(expect.objectContaining({
      content: "매일 오전 9시에 메일 보내줘",
      clientMessageId: expect.any(String),
      idempotencyKey: expect.any(String),
    })));
    expect(await screen.findByText("일정을 추가했어요.")).toBeInTheDocument();
  });

  it("sends an existing session message and exposes retry only for failed generations", async () => {
    const user = userEvent.setup();
    const api = {
      sendMessage: vi.fn().mockResolvedValue({
        message: { id: "message-new", role: "USER", content: "다시 확인해줘" },
        generation: queuedGeneration("generation-2"),
      }),
      retryGeneration: vi.fn().mockResolvedValue(queuedGeneration("generation-3")),
      getGeneration: vi.fn()
        .mockResolvedValueOnce({ id: "generation-2", status: "FAILED", errorMessage: "잠시 후 다시 시도해주세요." })
        .mockResolvedValueOnce({ id: "generation-3", status: "SUCCEEDED", assistantMessage: "재시도 완료" }),
    };
    const initialState = createInitialWorkspaceState({
      selectedSessionId: "session-1",
      chatMessages: [],
      generation: { id: "generation-old", status: "FAILED", errorMessage: "생성에 실패했어요." },
    });
    renderChat({ api, initialState, initialUser: { id: "user-1" } });

    await user.type(screen.getByRole("textbox", { name: "자동화 요청" }), "다시 확인해줘");
    await user.click(screen.getByRole("button", { name: "보내기" }));
    await waitFor(() => expect(api.sendMessage).toHaveBeenCalledWith("session-1", expect.objectContaining({
      content: "다시 확인해줘",
      clientMessageId: expect.any(String),
      idempotencyKey: expect.any(String),
    })));

    const retry = await screen.findByRole("button", { name: "다시 시도" });
    await user.click(retry);
    await waitFor(() => expect(api.retryGeneration).toHaveBeenCalledWith("generation-2", expect.any(String)));
  });

  it("opens the login modal instead of sending for a guest", async () => {
    const user = userEvent.setup();
    const api = {};
    renderChat({
      api,
      initialState: createInitialWorkspaceState({ chatMessages: [] }),
    });

    await user.type(screen.getByRole("textbox", { name: "자동화 요청" }), "새 작업");
    await user.click(screen.getByRole("button", { name: "보내기" }));

    expect(screen.getByText("Blocki 로그인")).toBeInTheDocument();
  });
});
