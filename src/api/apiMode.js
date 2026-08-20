// 환경 변수에 따라 동일한 화면 계약의 Mock API와 실제 API를 선택한다.
import { authApi } from "./authApi";
import { chatApi } from "./chatApi";
import { documentApi } from "./documentApi";
import { integrationApi } from "./integrationApi";
import { workflowApi } from "./workflowApi";
import { workspaceApi } from "./workspaceApi";
import { mockApi } from "../mock/mockApi";
import { createDocumentMockApi } from "../mock/documentMockApi";

const realApi = {
  ...authApi,
  ...chatApi,
  ...documentApi,
  ...integrationApi,
  ...workflowApi,
  ...workspaceApi,
  mode: "api",
};

const realDocumentApi = {
  ...documentApi,
  ...integrationApi,
  ...workspaceApi,
  mode: "api",
};

export function getAppApi({ mode = import.meta.env.VITE_DATA_MODE ?? "api" } = {}) {
  return mode === "api" ? realApi : mockApi;
}

export function getDocumentApi({ mode = import.meta.env.VITE_DATA_MODE ?? "api" } = {}) {
  return mode === "api" ? realDocumentApi : createDocumentMockApi();
}

export { realApi };
