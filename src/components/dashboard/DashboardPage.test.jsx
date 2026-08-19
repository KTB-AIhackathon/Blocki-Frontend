// 대시보드의 연결 버튼·문서 탭·문서 목록을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DashboardPage from "./DashboardPage";
import { DocumentProvider } from "../../state/DocumentContext";
import { AuthProvider } from "../../state/AuthContext";
import { createDocumentMockApi } from "../../mock/documentMockApi";

function renderDashboard(api = createDocumentMockApi()) {
  render(
    <AuthProvider skipBootstrap initialUser={{ id: "user-1", name: "마일스", email: "miles@example.com" }}>
      <DocumentProvider api={api}>
        <DashboardPage />
      </DocumentProvider>
    </AuthProvider>,
  );
}

describe("DashboardPage", () => {
  it("연결된 서비스 수와 포트폴리오·이력서 탭을 표시한다", async () => {
    renderDashboard();

    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "안녕하세요, 마일스님." })).toBeInTheDocument();
    expect(screen.getByText("1개 연결됨")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "포트폴리오" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "이력서" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub 연결됨" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "새 문서 만들기" })).not.toBeInTheDocument();
  });

  it("내 작업 화면에서 연결 상태를 바로 변경한다", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole("button", { name: "Notion 연결하기" }));

    expect(await screen.findByRole("button", { name: "Notion 연결됨" })).toBeDisabled();
    expect(screen.getByText("2개 연결됨")).toBeInTheDocument();
  });

  it("같은 유형의 문서를 아래로 계속 쌓아 보여준다", async () => {
    const api = createDocumentMockApi();
    api.listDocuments = async () => ({
      documents: [
        {
          id: "portfolio-1",
          type: "PORTFOLIO",
          title: "첫 번째 포트폴리오",
          latestVersionId: "portfolio-1-v1",
          versions: [{ id: "portfolio-1-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z" }],
        },
        {
          id: "portfolio-2",
          type: "PORTFOLIO",
          title: "두 번째 포트폴리오",
          latestVersionId: "portfolio-2-v1",
          versions: [{ id: "portfolio-2-v1", versionNumber: 1, createdAt: "2026-08-19T09:00:00Z" }],
        },
      ],
    });
    renderDashboard(api);

    expect(await screen.findByRole("heading", { name: "첫 번째 포트폴리오" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "두 번째 포트폴리오" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /문서 열기/ })).toHaveLength(2);
  });
});
