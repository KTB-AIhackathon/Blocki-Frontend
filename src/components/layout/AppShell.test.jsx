// 문서 작업 셸과 내 작업·설정 화면 전환이 실제 화면에 연결되는지 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../state/AuthContext";
import { DocumentProvider } from "../../state/DocumentContext";
import AppShell from "./AppShell";

function createDocumentApiDouble() {
  const documents = ["PORTFOLIO", "RESUME"].map((type) => ({
    id: `${type.toLowerCase()}-1`,
    type,
    title: type === "PORTFOLIO" ? "포트폴리오" : "이력서",
    latestVersionId: `${type.toLowerCase()}-v1`,
    versions: [{
      id: `${type.toLowerCase()}-v1`,
      versionNumber: 1,
      createdAt: "2026-08-18T09:00:00Z",
      markdown: "# 문서 내용",
    }],
  }));
  return {
    listIntegrations: vi.fn().mockResolvedValue({
      integrations: [
        { provider: "GITHUB", status: "CONNECTED", itemCount: 1 },
        { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
      ],
    }),
    listDocuments: vi.fn().mockResolvedValue({ documents }),
    getDocumentVersion: vi.fn(),
  };
}

function renderShell() {
  const api = createDocumentApiDouble();
  render(
    <AuthProvider api={{ ...api, getCurrentUser: vi.fn().mockResolvedValue(null), logout: vi.fn().mockResolvedValue({ ok: true }) }} skipBootstrap initialUser={{ id: "user-1", name: "마일스", email: "miles@example.com" }}>
      <DocumentProvider api={api}>
        <AppShell />
      </DocumentProvider>
    </AuthProvider>,
  );
  return api;
}

describe("AppShell", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("내 작업과 설정을 URL로 전환하고 명시적인 로그아웃을 제공한다", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/workspace");
    renderShell();

    expect(screen.getAllByText("Blocki")[0]).toBeInTheDocument();
    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 작업" })).toBeInTheDocument();
    expect(screen.queryByText("수집 범위 관리")).not.toBeInTheDocument();
    expect(screen.getByText("마일스")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toHaveTextContent("로그아웃");
    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(await screen.findByRole("heading", { name: "설정" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/settings");
    expect(screen.getByRole("heading", { name: "사용자 정보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "소스 연동 상태" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "AI 채팅" })).not.toBeInTheDocument();
  });

  it("문서 카드에서 /documents로 이동하고 두 문서 탭은 같은 경로를 사용한다", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/workspace");
    renderShell();

    await user.click(await screen.findByRole("button", { name: "문서 열기" }));
    expect(window.location.pathname).toBe("/documents");
    expect(screen.getByRole("heading", { name: "포트폴리오", level: 1 })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "이력서" }));
    expect(window.location.pathname).toBe("/documents");
    expect(screen.getByRole("heading", { name: "이력서", level: 1 })).toBeInTheDocument();
  });
});
