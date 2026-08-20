// 대시보드의 연결 버튼·문서 탭·문서 목록을 검증한다.
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";
import { DocumentProvider } from "../../state/DocumentContext";
import { AuthProvider } from "../../state/AuthContext";

function createVersion(documentId, type, versionNumber) {
  return {
    id: `${type.toLowerCase()}-v${versionNumber}`,
    documentId,
    type,
    title: type === "PORTFOLIO" ? "포트폴리오" : "이력서",
    versionNumber,
    createdAt: `2026-08-${17 + versionNumber}T09:00:00Z`,
    markdown: `# ${type === "PORTFOLIO" ? "포트폴리오" : "이력서"}`,
  };
}

function createDocumentApiDouble() {
  let integrations = [
    { provider: "GITHUB", status: "CONNECTED", itemCount: 4 },
    { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
  ];
  let automation = {
    enabled: false,
    schedule: { dayOfWeek: "MONDAY", time: "21:00", timezone: "Asia/Seoul" },
  };
  const portfolioVersion = createVersion("portfolio-1", "PORTFOLIO", 1);
  let documents = [{
    id: "portfolio-1",
    type: "PORTFOLIO",
    title: "포트폴리오",
    latestVersionId: portfolioVersion.id,
    versions: [portfolioVersion],
  }];
  const jobs = new Map();

  return {
    listIntegrations: vi.fn(async () => ({ integrations })),
    listDocuments: vi.fn(async () => ({ documents, dataNotice: null, missingData: [] })),
    getDocumentGenerationAutomation: vi.fn(async () => automation),
    updateDocumentGenerationAutomation: vi.fn(async (enabled) => {
      automation = { ...automation, enabled };
      return automation;
    }),
    getDocumentVersion: vi.fn(async (documentId, versionId) => documents
      .find((document) => document.id === documentId)
      ?.versions.find((version) => version.id === versionId)),
    connectIntegration: vi.fn(async (provider) => {
      const integration = { provider, status: "CONNECTED", itemCount: 1 };
      integrations = integrations.map((item) => item.provider === provider ? integration : item);
      return { integration };
    }),
    disconnectIntegration: vi.fn(async (provider) => {
      const integration = { provider, status: "DISCONNECTED", itemCount: 0 };
      integrations = integrations.map((item) => item.provider === provider ? integration : item);
      return { integration };
    }),
    generateDocument: vi.fn(async (type) => {
      const existing = documents.find((document) => document.type === type);
      const versionNumber = (existing?.versions.length ?? 0) + 1;
      const documentId = existing?.id ?? `${type.toLowerCase()}-1`;
      const version = createVersion(documentId, type, versionNumber);
      if (existing) {
        existing.latestVersionId = version.id;
        existing.versions.push(version);
      } else {
        documents = [...documents, {
          id: documentId,
          type,
          title: type === "PORTFOLIO" ? "포트폴리오" : "이력서",
          latestVersionId: version.id,
          versions: [version],
        }];
      }
      const job = { id: `job-${type}`, status: "SUCCEEDED", documentId, versionId: version.id };
      jobs.set(job.id, job);
      return job;
    }),
    getDocumentGeneration: vi.fn(async (jobId) => jobs.get(jobId)),
  };
}

function renderDashboard(api = createDocumentApiDouble()) {
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
    expect(document.querySelector('[data-provider-logo="GITHUB"]')).toBeInTheDocument();
    expect(document.querySelector('[data-provider-logo="NOTION"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "안녕하세요, 마일스님." })).toBeInTheDocument();
    expect(screen.getByText("1개 연결됨")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "포트폴리오" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "이력서" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub 연결됨, 눌러서 연결 해제" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문서 생성" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문서 생성" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "이력서 생성" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "포트폴리오 생성" })).not.toBeInTheDocument();
  });

  it("문서 자동화 토글을 화면 오른쪽 상단에 표시하고 화면에서만 전환한다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    renderDashboard(api);

    const automationToggle = await screen.findByRole("switch", { name: "문서 자동화" });
    const generateButton = screen.getByRole("button", { name: "문서 생성" });

    expect(api.getDocumentGenerationAutomation).toHaveBeenCalledTimes(1);
    expect(automationToggle.closest(".dashboard-header-actions")).not.toBeNull();
    expect(generateButton.closest(".document-generation-actions")).not.toBeNull();
    expect(generateButton.closest(".dashboard-header-actions")).toBeNull();
    expect(automationToggle).toHaveAttribute("aria-checked", "false");

    await user.click(automationToggle);

    expect(api.updateDocumentGenerationAutomation).toHaveBeenCalledWith(true);
    expect(automationToggle).toHaveAttribute("aria-checked", "true");
  });

  it("OAuth 완료 메시지를 받으면 백엔드 연동 상태를 다시 조회한다", async () => {
    const api = createDocumentApiDouble();
    api.listIntegrations
      .mockResolvedValueOnce({ integrations: [
        { provider: "GITHUB", status: "CONNECTED", itemCount: 4 },
        { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
      ] })
      .mockResolvedValue({ integrations: [
        { provider: "GITHUB", status: "CONNECTED", itemCount: 4 },
        { provider: "NOTION", status: "CONNECTED", itemCount: 1 },
      ] });
    renderDashboard(api);

    expect(await screen.findByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "blocki:oauth-complete", provider: "NOTION", result: "success" },
        origin: window.location.origin,
      }));
    });

    expect(await screen.findByRole("button", { name: "Notion 연결됨, 눌러서 연결 해제" })).toBeEnabled();
  });

  it("연결됨 버튼을 누르면 연결하기 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    renderDashboard(api);

    await user.click(await screen.findByRole("button", { name: "GitHub 연결됨, 눌러서 연결 해제" }));

    expect(await screen.findByRole("button", { name: "GitHub 연결하기" })).toBeInTheDocument();
    expect(screen.getByText("0개 연결됨")).toBeInTheDocument();
    expect(api.getDocumentGenerationAutomation).toHaveBeenCalledTimes(2);
  });

  it("같은 유형의 문서를 아래로 계속 쌓아 보여준다", async () => {
    const api = createDocumentApiDouble();
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

    expect(await screen.findByRole("heading", { name: "첫 번째 포트폴리오 v1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "두 번째 포트폴리오 v1" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /문서 열기/ })).toHaveLength(2);
  });

  it("이력서 탭에서 한 문서의 모든 버전을 최신순 목록으로 보여주고 현재 경로를 유지한다", async () => {
    window.history.replaceState({}, "", "/workspace");
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    api.listDocuments = async () => ({
      documents: [{
        id: "resume-1",
        type: "RESUME",
        title: "임태현 이력서",
        latestVersionId: "resume-v2",
        versions: [
          { id: "resume-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z" },
          { id: "resume-v2", versionNumber: 2, createdAt: "2026-08-19T09:00:00Z" },
        ],
      }],
    });
    renderDashboard(api);

    await user.click(await screen.findByRole("tab", { name: "이력서" }));

    expect(await screen.findByRole("heading", { name: "임태현 이력서 v2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "임태현 이력서 v1" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/workspace");
  });

  it("단일 생성 버튼이 현재 선택한 탭의 문서 유형을 생성한다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    api.listIntegrations = vi.fn(async () => ({ integrations: [
      { provider: "GITHUB", status: "CONNECTED", itemCount: 4 },
      { provider: "NOTION", status: "CONNECTED", itemCount: 2 },
    ] }));
    renderDashboard(api);

    const generateButton = await screen.findByRole("button", { name: "문서 생성" });
    expect(generateButton).toBeEnabled();
    await user.click(generateButton);

    expect(api.generateDocument).toHaveBeenCalledWith("PORTFOLIO");

    await user.click(screen.getByRole("tab", { name: "이력서" }));
    await user.click(screen.getByRole("button", { name: "문서 생성" }));

    expect(api.generateDocument).toHaveBeenLastCalledWith("RESUME");
    expect(await screen.findByRole("heading", { name: "이력서 v1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "이력서" })).toHaveAttribute("aria-selected", "true");
  });

  it("연동 상태 조회가 실패해도 문서와 누락 안내를 유지한다", async () => {
    const api = createDocumentApiDouble();
    api.listIntegrations = async () => {
      throw new Error("integration unavailable");
    };
    renderDashboard(api);

    expect(await screen.findByRole("heading", { name: "포트폴리오 v1" })).toBeInTheDocument();
    expect(screen.getByText("누락된 데이터가 있어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub 연결하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notion 연결하기" })).toBeInTheDocument();
  });

  it("연결되지 않은 소스의 누락 안내를 탭 전환 후에도 유지하고 재시도 버튼은 숨긴다", async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByText("누락된 데이터가 있어요")).toBeInTheDocument();
    expect(screen.getByText("Notion: 연결되지 않음")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "이력서" }));

    expect(screen.getByText("누락된 데이터가 있어요")).toBeInTheDocument();
    expect(screen.getByText("Notion: 연결되지 않음")).toBeInTheDocument();
  });
});
