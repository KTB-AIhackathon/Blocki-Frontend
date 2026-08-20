// 화면에서 사용하는 실제 백엔드 API adapter를 조합한다.
import { authApi } from "./authApi";
import { chatApi } from "./chatApi";
import { documentApi } from "./documentApi";
import { integrationApi } from "./integrationApi";
import { workflowApi } from "./workflowApi";
import { workspaceApi } from "./workspaceApi";

const realApi = {
  ...authApi,
  ...chatApi,
  ...documentApi,
  ...integrationApi,
  ...workflowApi,
  ...workspaceApi,
};

const realDocumentApi = {
  ...documentApi,
  ...integrationApi,
  ...workspaceApi,
};

export function getAppApi() {
  return realApi;
}

export function getDocumentApi() {
  return realDocumentApi;
}

export { realApi };
