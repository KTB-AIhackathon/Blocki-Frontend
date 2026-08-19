// API 명세의 items·*Id 응답을 화면 내부 모델로 변환하는지 검증한다.
import { describe, expect, it, vi } from "vitest";
import { createChatApi } from "./chatApi";

describe("chatApi response mapping", () => {
  it("maps sessions and messages from the public API shape", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({
        items: [{ sessionId: "session-1", title: "운영", firstMessagePreview: "확인해줘" }],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        items: [{ messageId: "message-1", role: "USER", content: "확인해줘" }],
        nextCursor: null,
      });
    const api = createChatApi({ request });

    await expect(api.listSessions()).resolves.toMatchObject({
      sessions: [{ id: "session-1", preview: "확인해줘" }],
      nextCursor: "cursor-1",
    });
    await expect(api.listMessages("session-1")).resolves.toMatchObject({
      messages: [{ id: "message-1", content: "확인해줘" }],
    });
  });

  it("maps asynchronous creation identifiers", async () => {
    const request = vi.fn().mockResolvedValue({
      session: { sessionId: "session-1" },
      userMessage: { messageId: "message-1", role: "USER", content: "생성해줘" },
      generation: { generationId: "generation-1", status: "QUEUED" },
    });
    const api = createChatApi({ request });

    await expect(api.createSession({ content: "생성해줘", clientMessageId: "client-1" })).resolves.toMatchObject({
      session: { id: "session-1" },
      message: { id: "message-1" },
      generation: { id: "generation-1" },
    });
  });
});
