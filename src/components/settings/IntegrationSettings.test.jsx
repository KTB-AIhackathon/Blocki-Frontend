// 설정 화면의 읽기 전용 사용자 정보와 소스 연결 상태 변경을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IntegrationSettings from "./IntegrationSettings";
import { DocumentProvider } from "../../state/DocumentContext";
import { AuthProvider } from "../../state/AuthContext";

function createDocumentApiDouble() {
  let integrations = [
    { provider: "GITHUB", status: "CONNECTED", itemCount: 1 },
    { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
  ];
  return {
    listIntegrations: vi.fn(async () => ({ integrations })),
    listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
    getDocumentVersion: vi.fn(),
    connectIntegration: vi.fn(),
    disconnectIntegration: vi.fn(async (provider) => {
      const integration = { provider, status: "DISCONNECTED", itemCount: 0 };
      integrations = integrations.map((item) => item.provider === provider ? integration : item);
      return { integration };
    }),
  };
}

describe("IntegrationSettings", () => {
  it("수정 폼 없이 사용자 정보와 소스 연동 상태를 보여준다", async () => {
    const api = createDocumentApiDouble();
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
    expect(await screen.findByRole("button", { name: "GitHub 연결됨, 눌러서 연결 해제" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /저장|변경/ })).not.toBeInTheDocument();
    expect(screen.queryByText("연결 해제", { exact: true })).not.toBeInTheDocument();
  });

  it("연결됨 버튼으로 소스 연결을 해제한다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    render(
      <AuthProvider skipBootstrap initialUser={{ id: "user-1", name: "마일스", email: "miles@example.com" }}>
        <DocumentProvider api={api}>
          <IntegrationSettings />
        </DocumentProvider>
      </AuthProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "GitHub 연결됨, 눌러서 연결 해제" }));

    expect(await screen.findByRole("button", { name: "GitHub 연결하기" })).toBeInTheDocument();
  });
});
