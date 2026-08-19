// 명세의 워크스페이스 요약 응답을 최소 화면 계약으로 제공한다.
import { request } from "./apiClient";

export function createWorkspaceApi(client = { request }) {
  return {
    getWorkspace() {
      return client.request("/workspace").then((result) => result?.data ?? result);
    },
  };
}

export const workspaceApi = createWorkspaceApi();
