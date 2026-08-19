// 명세의 회원가입·로그인·내 정보 API를 인증 화면 계약으로 변환한다.
import { request, setAccessToken, resetApiAuth } from "./apiClient";

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
      return client.request("/users/me").then((result) => normalizeUser(unwrapData(result)));
    },

    signup(payload) {
      return client.request("/auth/sign-up", { method: "POST", body: payload, auth: false })
        .then((result) => unwrapData(result));
    },

    login(payload) {
      return client.request("/auth/login", { method: "POST", body: payload, auth: false }).then((result) => {
        const data = unwrapData(result);
        setAccessToken(data.accessToken);
        return { ...data, user: normalizeUser(data.user) };
      });
    },

    logout() {
      resetApiAuth();
      return Promise.resolve({ ok: true });
    },

  };
}

export const authApi = createAuthApi();
