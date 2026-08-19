// 워크플로우·주간 캘린더·블록 상세와 일정 이동 API를 제공한다.
import { createIdempotencyKey, request } from "./apiClient";

function normalizeCalendarItem(item, workflowId) {
  return {
    ...item,
    workflowId: item.workflowId ?? workflowId,
    prompt: item.prompt ?? item.sourcePrompt,
    actionSummary: item.actionSummary ?? item.name,
  };
}

function normalizeWorkflow(workflow = {}) {
  const workflowId = workflow.id ?? workflow.workflowId;
  return {
    ...workflow,
    id: workflowId,
    calendarItems: (workflow.blocks ?? []).filter((block) => block.calendar).map((block) => normalizeCalendarItem({
      ...block,
      ...block.calendar,
    }, workflowId)),
    storedBlocks: [],
  };
}

function normalizeDetail(detail = {}) {
  return {
    ...detail,
    prompt: detail.prompt ?? detail.sourcePrompt,
    actionSummary: detail.actionSummary ?? detail.operation?.displayName ?? detail.name,
    connectionStatus: detail.connectionStatus ?? detail.connection?.status,
    latestRunStatus: detail.latestRunStatus ?? detail.latestExecution?.status,
    actions: detail.actions ?? (detail.operation ? [
      { title: detail.operation.displayName, description: detail.operation.toolKey ?? detail.operation.kind },
    ] : []),
  };
}

export function createWorkflowApi(client = { request }) {
  return {
    getWorkflow(sessionId) {
      return client.request(`/chat-sessions/${sessionId}/workflow`).then(normalizeWorkflow);
    },

    getCalendar(sessionId, { weekStart, zoneId = "Asia/Seoul" }) {
      const query = new URLSearchParams({ weekStart, zoneId });
      return client.request(`/chat-sessions/${sessionId}/calendar?${query}`).then((result) => ({
        ...result,
        items: (result?.items ?? []).map((item) => normalizeCalendarItem(item, result.workflowId)),
      }));
    },

    getBlockDetail(workflowId, blockId) {
      return client.request(`/workflows/${workflowId}/blocks/${blockId}`).then(normalizeDetail);
    },

    moveBlock({ workflowId, blockId, startAt, endAt, zoneId, revision }) {
      return client.request(`/workflows/${workflowId}/blocks/${blockId}/schedule`, {
        method: "PATCH",
        body: { startAt, endAt, zoneId },
        ifMatch: `"${revision}"`,
        idempotencyKey: createIdempotencyKey(),
      }).then((result) => ({
        ...result,
        revision: result.workflowRevision,
        item: normalizeCalendarItem(result, workflowId),
      }));
    },
  };
}

export const workflowApi = createWorkflowApi();
