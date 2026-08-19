// 워크플로우·상세·일정 이동 응답을 화면 모델로 변환하는지 검증한다.
import { describe, expect, it, vi } from "vitest";
import { createWorkflowApi } from "./workflowApi";

describe("workflowApi response mapping", () => {
  it("maps workflow blocks and calendar fields", async () => {
    const request = vi.fn().mockResolvedValue({
      workflowId: "workflow-1",
      revision: 3,
      blocks: [{
        blockId: "block-1",
        name: "메일 보내기",
        calendar: { startAt: "2026-08-20T09:00:00+09:00", endAt: "2026-08-20T09:30:00+09:00" },
      }],
    });
    const api = createWorkflowApi({ request });

    await expect(api.getWorkflow("session-1")).resolves.toMatchObject({
      id: "workflow-1",
      calendarItems: [{ blockId: "block-1", startAt: "2026-08-20T09:00:00+09:00" }],
    });
  });

  it("maps detail and schedule revision fields", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({
        blockId: "block-1",
        sourcePrompt: "메일 보내줘",
        operation: { displayName: "메일 보내기", toolKey: "mail.send" },
        connection: { status: "CONNECTED" },
        latestExecution: { status: "NOT_RUN" },
      })
      .mockResolvedValueOnce({ blockId: "block-1", workflowRevision: 4, startAt: "2026-08-21T10:00:00+09:00", endAt: "2026-08-21T10:30:00+09:00" });
    const api = createWorkflowApi({ request });

    await expect(api.getBlockDetail("workflow-1", "block-1")).resolves.toMatchObject({
      prompt: "메일 보내줘",
      actionSummary: "메일 보내기",
      connectionStatus: "CONNECTED",
    });
    await expect(api.moveBlock({ workflowId: "workflow-1", blockId: "block-1", startAt: "2026-08-21T10:00:00+09:00", endAt: "2026-08-21T10:30:00+09:00", revision: 3 })).resolves.toMatchObject({
      revision: 4,
      item: { blockId: "block-1" },
    });
  });
});
