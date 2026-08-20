// 백엔드 없이도 같은 응답 계약으로 화면을 실행하는 Mock API를 제공한다.
import { addWeeks, getMondayWeekStart, toDateKey } from "../domain/calendar/dateUtils";
import { demoGeneration, demoMessages, demoSessions, demoUser, demoWorkflows } from "./fixtures";

const MOCK_DELAY_MS = 40;
const MOCK_USER_KEY = "blocki.mockUser";
const MOCK_REGISTERED_USER_KEY = "blocki.mockRegisteredUser";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

function apiError(code, message, options = {}) {
  return Object.assign(new Error(message), {
    code,
    fieldErrors: {},
    retryable: false,
    requestId: `mock-${Date.now()}`,
    ...options,
  });
}

function delay(value, milliseconds = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), milliseconds);
  });
}

function readSessionUser() {
  try {
    return JSON.parse(window.sessionStorage.getItem(MOCK_USER_KEY)) ?? null;
  } catch {
    return null;
  }
}

function readRegisteredUser() {
  try {
    return JSON.parse(window.sessionStorage.getItem(MOCK_REGISTERED_USER_KEY)) ?? null;
  } catch {
    return null;
  }
}

function storeSessionUser(user) {
  if (user) {
    window.sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    window.sessionStorage.removeItem(MOCK_USER_KEY);
  }
}

function storeRegisteredUser(user) {
  window.sessionStorage.setItem(MOCK_REGISTERED_USER_KEY, JSON.stringify(user));
}

export function createMockApi() {
  const state = {
    user: readSessionUser(),
    registeredUser: readRegisteredUser(),
    sessions: clone(demoSessions),
    messages: clone(demoMessages),
    workflows: clone(demoWorkflows),
  };
  const generations = new Map();

  function getWorkflowById(workflowId) {
    return Object.values(state.workflows).find((workflow) => workflow.id === workflowId);
  }

  function getWorkflowForSession(sessionId) {
    return state.workflows[sessionId] ?? createEmptyWorkflow(sessionId);
  }

  function createEmptyWorkflow(sessionId) {
    const workflow = {
      id: `workflow-${sessionId}`,
      sessionId,
      title: "새 자동화",
      revision: 1,
      calendarItems: [],
      storedBlocks: [],
    };
    state.workflows[sessionId] = workflow;
    return workflow;
  }

  function appendSessionMessage(sessionId, message) {
    state.messages[sessionId] ??= [];
    state.messages[sessionId].push(message);
    const session = state.sessions.find((candidate) => candidate.id === sessionId);
    if (session) {
      session.preview = message.content;
      session.updatedAt = message.createdAt;
      session.messageCount = state.messages[sessionId].length;
    }
  }

  function queueGeneration(sessionId, content) {
    const id = createId("generation");
    const generation = {
      id,
      sessionId,
      status: "QUEUED",
      assistantMessage: content.includes("질문")
        ? "일정을 만들기 전에 어떤 시간대를 사용할지 알려주세요."
        : "자동화 업무를 생성했어요. 캘린더에 반영했습니다.",
      pollCount: 0,
    };
    generations.set(id, generation);
    return generation;
  }

  return {
    mode: "mock",

    async getCurrentUser() {
      return delay(state.user);
    },

    async signup({ email, name }) {
      if (email.toLowerCase().includes("existing")) {
        throw apiError("EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.", {
          fieldErrors: { email: "이미 가입된 이메일입니다." },
        });
      }
      state.registeredUser = {
        ...demoUser,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      storeRegisteredUser(state.registeredUser);
      return delay({ user: state.registeredUser });
    },

    async login({ email, password }) {
      if (email.toLowerCase().includes("invalid") || password === "wrong") {
        throw apiError("INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해주세요.");
      }
      const normalizedEmail = email.trim().toLowerCase();
      const registeredUser = state.registeredUser?.email === normalizedEmail
        ? state.registeredUser
        : { ...demoUser, name: normalizedEmail.split("@")[0] };
      state.user = { ...registeredUser, email: normalizedEmail };
      storeSessionUser(state.user);
      return delay({
        accessToken: "mock-access-token",
        tokenType: "Bearer",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: state.user,
      });
    },

    async logout() {
      state.user = null;
      storeSessionUser(null);
      return delay({ ok: true });
    },

    async listSessions() {
      return delay({ sessions: state.sessions, nextCursor: null });
    },

    async listMessages(sessionId) {
      return delay({ messages: state.messages[sessionId] ?? [], nextCursor: null });
    },

    async createSession({ content }) {
      const sessionId = createId("session");
      const now = new Date().toISOString();
      const message = {
        id: createId("message"),
        role: "USER",
        content,
        createdAt: now,
      };
      const session = {
        id: sessionId,
        title: content.slice(0, 24),
        preview: content,
        updatedAt: now,
        messageCount: 1,
        generationStatus: "QUEUED",
      };
      state.sessions.unshift(session);
      state.messages[sessionId] = [message];
      createEmptyWorkflow(sessionId);
      const generation = queueGeneration(sessionId, content);
      return delay({ session, message, generation });
    },

    async sendMessage(sessionId, { content }) {
      const now = new Date().toISOString();
      const message = {
        id: createId("message"),
        role: "USER",
        content,
        createdAt: now,
      };
      appendSessionMessage(sessionId, message);
      const generation = queueGeneration(sessionId, content);
      return delay({ message, generation });
    },

    async getGeneration(generationId) {
      const generation = generations.get(generationId) ?? demoGeneration;
      if (generation.pollCount != null) {
        generation.pollCount += 1;
        if (generation.pollCount >= 2) {
          generation.status = generation.assistantMessage.includes("어떤") ? "NEEDS_INPUT" : "SUCCEEDED";
          const sessionMessages = state.messages[generation.sessionId] ?? [];
          if (!sessionMessages.some((message) => message.generationId === generation.id)) {
            const assistant = {
              id: createId("message"),
              role: "ASSISTANT",
              content: generation.assistantMessage,
              createdAt: new Date().toISOString(),
              generationId: generation.id,
              generationStatus: generation.status,
            };
            appendSessionMessage(generation.sessionId, assistant);
          }
        } else {
          generation.status = "RUNNING";
        }
      }
      return delay(generation);
    },

    async retryGeneration(generationId) {
      const previous = generations.get(generationId);
      if (!previous) {
        throw apiError("GENERATION_NOT_FOUND", "생성 작업을 찾을 수 없습니다.");
      }
      const generation = queueGeneration(previous.sessionId, "재시도 작업");
      return delay(generation);
    },

    async getWorkflow(sessionId) {
      return delay(getWorkflowForSession(sessionId));
    },

    async getCalendar(sessionId, { weekStart }) {
      const workflow = getWorkflowForSession(sessionId);
      const normalizedWeekStart = getMondayWeekStart(weekStart);
      const weekEnd = addWeeks(normalizedWeekStart, 1);
      const items = workflow.calendarItems.filter((item) => {
        const dateKey = toDateKey(item.startAt);
        return dateKey >= normalizedWeekStart && dateKey < weekEnd;
      });
      return delay({
        weekStart: normalizedWeekStart,
        zoneId: "Asia/Seoul",
        revision: workflow.revision,
        items,
        storedBlocks: workflow.storedBlocks,
      });
    },

    async getBlockDetail(workflowId, blockId) {
      const workflow = getWorkflowById(workflowId);
      const block = [...(workflow?.calendarItems ?? []), ...(workflow?.storedBlocks ?? [])].find(
        (candidate) => candidate.blockId === blockId,
      );
      if (!block) {
        throw apiError("BLOCK_NOT_FOUND", "일정 블록을 찾을 수 없습니다.");
      }
      return delay({
        ...block,
        actions: [
          { title: block.actionSummary, description: "에이전트가 실행할 작업" },
          { title: "결과 확인", description: "실행 결과를 사용자에게 전달" },
        ],
      });
    },

    async moveBlock({ workflowId, blockId, startAt, endAt, revision }) {
      const workflow = getWorkflowById(workflowId);
      if (!workflow) {
        throw apiError("WORKFLOW_NOT_FOUND", "자동화를 찾을 수 없습니다.");
      }
      if (revision != null && Number(revision) !== workflow.revision) {
        throw apiError("WORKFLOW_REVISION_CONFLICT", "다른 변경이 먼저 반영되었습니다.", {
          retryable: true,
        });
      }
      const block = workflow.calendarItems.find((candidate) => candidate.blockId === blockId);
      if (!block) {
        throw apiError("BLOCK_NOT_FOUND", "일정 블록을 찾을 수 없습니다.");
      }
      block.startAt = startAt;
      block.endAt = endAt;
      workflow.revision += 1;
      return delay({ revision: workflow.revision, item: block });
    },
  };
}

export const mockApi = createMockApi();
