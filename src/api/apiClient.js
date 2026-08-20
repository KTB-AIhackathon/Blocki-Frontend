// Spring 공개 API의 Bearer 인증·공통 응답·오류 처리를 적용한다.
const API_BASE_PATH = "/api/v1";
const ACCESS_TOKEN_KEY = "blocki.accessToken";

function getSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

let accessToken = getSessionStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;

export function getApiOrigin() {
  return import.meta.env.VITE_API_ORIGIN ?? "";
}

export function buildApiUrl(path) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/api/v1") ? path : `${API_BASE_PATH}${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
}

export function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `idempotency-${Date.now()}-${Math.random()}`;
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (accessToken) {
    getSessionStorage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    getSessionStorage()?.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function resetApiAuth() {
  setAccessToken(null);
}

export function resetCsrfToken() {
  resetApiAuth();
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function normalizeApiError(body, response) {
  const errorBody = body?.error ?? body ?? {};
  const requestId =
    errorBody.traceId ??
    errorBody.requestId ??
    response?.headers?.get?.("X-Request-ID") ??
    response?.headers?.get?.("X-Request-Id") ??
    null;
  const rawFieldErrors = errorBody.fieldErrors;
  const fieldErrors = Array.isArray(rawFieldErrors)
    ? Object.fromEntries(rawFieldErrors.map((fieldError) => [
      fieldError.field,
      fieldError.reason ?? fieldError.message ?? "입력값을 확인해주세요.",
    ]))
    : rawFieldErrors ?? {};
  const error = new Error(errorBody.message ?? "요청을 처리하지 못했습니다.");
  error.code = errorBody.code ?? `HTTP_${response?.status ?? 500}`;
  error.fieldErrors = fieldErrors;
  error.retryable = errorBody.retryable ?? (response?.status >= 500 || response?.status === 429);
  error.requestId = requestId;
  error.traceId = errorBody.traceId ?? null;
  error.missingSources = errorBody.missingSources ?? [];
  return error;
}

function buildFetchOptions(options = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };
  if (accessToken && options.auth !== false) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json; charset=UTF-8";
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  if (options.ifMatch) {
    headers["If-Match"] = options.ifMatch;
  }

  return {
    method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    redirect: options.redirect,
  };
}

export async function request(path, options = {}) {
  const response = await fetch(buildApiUrl(path), buildFetchOptions(options));
  if (options.responseType === "blob") {
    if (!response.ok) {
      const body = await readResponseBody(response);
      throw normalizeApiError(body, response);
    }
    return response.blob();
  }
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw normalizeApiError(body, response);
  }
  return body;
}

export async function requestRedirect(path, options = {}) {
  const response = await fetch(buildApiUrl(path), buildFetchOptions({ ...options, redirect: "manual" }));
  if (response.status >= 300 && response.status < 400) {
    return { location: response.headers.get("Location"), status: response.status };
  }
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw normalizeApiError(body, response);
  }
  return { location: response.headers.get("Location"), status: response.status, body };
}
