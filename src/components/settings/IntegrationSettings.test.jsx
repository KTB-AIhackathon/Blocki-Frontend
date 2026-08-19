// API가 확정되기 전 설정 화면이 더미 안내만 제공하는지 검증한다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IntegrationSettings from "./IntegrationSettings";
import { DocumentProvider } from "../../state/DocumentContext";
import { AuthProvider } from "../../state/AuthContext";
import { createDocumentMockApi } from "../../mock/documentMockApi";

describe("IntegrationSettings", () => {
  it("수정 폼 없이 사용자 정보와 소스 연동 상태를 보여준다", async () => {
    const api = createDocumentMockApi();
    render(
      <AuthProvider
        api={{ ...api, getCurrentUser: vi.fn(), logout: vi.fn() }}
        skipBootstrap
        initialUser={{ id: "user-1", name: "마일스", email: "miles@example.com" }}
      >
        <DocumentProvider api={api}>
          <IntegrationSettings />
        </DocumentProvider>
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: "설정" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "사용자 정보" })).toBeInTheDocument();
    expect(screen.getByText("마일스")).toBeInTheDocument();
    expect(screen.getByText("miles@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "소스 연동 상태" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "GitHub 연결됨" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /저장|변경|연결 해제/ })).not.toBeInTheDocument();
  });
});
