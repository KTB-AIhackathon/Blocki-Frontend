// 명세의 회원가입·로그인·내 정보 API를 인증 화면 계약으로 변환한다.
import { AUTH_SESSION_KEY, request, setAccessToken, resetApiAuth } from "./apiClient";

function getSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function storeAuthSession(user, expiresAt) {
  getSessionStorage()?.setItem(AUTH_SESSION_KEY, JSON.stringify({ user, expiresAt }));
}

function clearAuthSession() {
  getSessionStorage()?.removeItem(AUTH_SESSION_KEY);
}

function readAuthSession() {
  try {
    const session = JSON.parse(getSessionStorage()?.getItem(AUTH_SESSION_KEY) ?? "null");
    if (!session?.user || !session.expiresAt || Date.parse(session.expiresAt) <= Date.now()) {
      clearAuthSession();
      resetApiAuth();
      return null;
    }
    return normalizeUser(session.user);
  } catch {
    clearAuthSession();
    resetApiAuth();
    return null;
  }
}

function normalizeUser(result) {
  const user = result?.user ?? result?.data?.user ?? result;
  if (!user) {
    return null;
  }
  return {
    ...user,
    id: user.id ?? user.userId,
  };
}

function unwrapData(result) {
  return result?.data ?? result ?? {};
}

export function createAuthApi(client = { request }) {
  return {
    getCurrentUser() {
      return Promise.resolve(readAuthSession());
    },

    signup(payload) {
      return client.request("/auth/sign-up", { method: "POST", body: payload, auth: false })
        .then((result) => unwrapData(result));
    },

    login(payload) {
      return client.request("/auth/login", { method: "POST", body: payload, auth: false }).then((result) => {
        const data = unwrapData(result);
        const user = normalizeUser(data.user);
        setAccessToken(data.accessToken);
        storeAuthSession(user, data.expiresAt);
        return { ...data, user };
      });
    },

    logout() {
      clearAuthSession();
      resetApiAuth();
      return Promise.resolve({ ok: true });
    },

  };
}

export const authApi = createAuthApi();
