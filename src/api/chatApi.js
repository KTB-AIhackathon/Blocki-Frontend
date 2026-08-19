// 채팅 세션·메시지·생성 상태 API를 제공한다.
import { createIdempotencyKey, request } from "./apiClient";

function withQuery(path, values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value != null) {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function normalizeSession(session = {}) {
  return {
    ...session,
    id: session.id ?? session.sessionId,
    preview: session.preview ?? session.firstMessagePreview ?? "",
    messageCount: session.messageCount ?? 0,
    generationStatus: session.generationStatus ?? session.latestGenerationStatus,
  };
}

function normalizeMessage(message = {}) {
  return {
    ...message,
    id: message.id ?? message.messageId,
  };
}

function normalizeGeneration(generation = {}) {
  return {
    ...generation,
    id: generation.id ?? generation.generationId,
    errorMessage: generation.errorMessage ?? generation.failure?.message,
  };
}

function normalizeList(result, key, mapper) {
  return {
    ...result,
    [key]: (result?.items ?? result?.[key] ?? []).map(mapper),
  };
}

export function createChatApi(client = { request }) {
  return {
    listSessions({ limit = 20, cursor = null } = {}) {
      return client.request(withQuery("/chat-sessions", { limit, cursor }))
        .then((result) => normalizeList(result, "sessions", normalizeSession));
    },

    listMessages(sessionId, { limit = 50, cursor = null } = {}) {
      return client.request(withQuery(`/chat-sessions/${sessionId}/messages`, { limit, cursor }))
        .then((result) => normalizeList(result, "messages", normalizeMessage));
    },

    createSession({ content, clientMessageId, zoneId, idempotencyKey = createIdempotencyKey() }) {
      return client.request("/chat-sessions", {
        method: "POST",
        body: { content, clientMessageId, zoneId },
        idempotencyKey,
      }).then((result) => ({
        ...result,
        session: normalizeSession(result.session),
        message: normalizeMessage(result.message ?? result.userMessage),
        generation: normalizeGeneration(result.generation),
      }));
    },

    sendMessage(sessionId, { content, clientMessageId, idempotencyKey = createIdempotencyKey() }) {
      return client.request(`/chat-sessions/${sessionId}/messages`, {
        method: "POST",
        body: { content, clientMessageId },
        idempotencyKey,
      }).then((result) => ({
        ...result,
        message: normalizeMessage(result.message ?? result.userMessage),
        generation: normalizeGeneration(result.generation),
      }));
    },

    getGeneration(generationId, options = {}) {
      return client.request(`/generations/${generationId}`, options).then(normalizeGeneration);
    },

    retryGeneration(generationId, idempotencyKey = createIdempotencyKey()) {
      return client.request(`/generations/${generationId}/retry`, {
        method: "POST",
        idempotencyKey,
      }).then(normalizeGeneration);
    },
  };
}

export const chatApi = createChatApi();
