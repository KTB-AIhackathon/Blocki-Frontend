// 문서 탭·버전 선택과 안전한 Markdown 미리보기를 검증한다.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DocumentWorkspace from "./DocumentWorkspace";
import { DocumentProvider } from "../../state/DocumentContext";

function createDocumentApiDouble() {
  const documents = [
    {
      id: "portfolio-1",
      type: "PORTFOLIO",
      title: "Blocki 프로젝트 포트폴리오",
      latestVersionId: "portfolio-v1",
      versions: [{ id: "portfolio-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z", markdown: "# 포트폴리오" }],
    },
    {
      id: "resume-1",
      type: "RESUME",
      title: "Blocki 개발자 이력서",
      latestVersionId: "resume-v1",
      versions: [{ id: "resume-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z", markdown: "# 이력서" }],
    },
  ];
  return {
    listIntegrations: vi.fn().mockResolvedValue({ integrations: [] }),
    listDocuments: vi.fn().mockResolvedValue({ documents }),
    getDocumentVersion: vi.fn(),
    downloadDocumentVersionPdf: vi.fn().mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" })),
  };
}

describe("DocumentWorkspace", () => {
  it("문서 유형 탭 없이 선택된 Markdown을 읽기 전용으로 보여준다", async () => {
    render(
      <DocumentProvider api={createDocumentApiDouble()} initialView="DOCUMENT">
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Blocki 프로젝트 포트폴리오", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist", { name: "문서 유형" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF 다운로드" })).toBeEnabled();
  });

  it("선택한 문서 버전의 PDF를 받아 브라우저 다운로드를 시작한다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    const createObjectURL = vi.fn().mockReturnValue("blob:pdf");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <DocumentProvider api={api} initialView="DOCUMENT">
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "PDF 다운로드" }));

    expect(api.downloadDocumentVersionPdf).toHaveBeenCalledWith("portfolio-1", "portfolio-v1");
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalled();
    expect(anchorClick.mock.instances[0]).toHaveProperty("download", "Blocki-프로젝트-포트폴리오-v1.pdf");
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf"));

    vi.unstubAllGlobals();
  });

  it("failed_version_fetch_shows_error_state_toast_and_retry", async () => {
    const api = {
      listIntegrations: vi.fn().mockResolvedValue({ integrations: [] }),
      listDocuments: vi.fn().mockResolvedValue({
        documents: [{
          id: "portfolio-1",
          type: "PORTFOLIO",
          title: "포트폴리오",
          latestVersionId: "portfolio-v1",
          versions: [{ id: "portfolio-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z" }],
        }],
      }),
      getDocumentVersion: vi.fn().mockRejectedValue(new Error("문서를 불러오지 못했어요.")),
    };

    render(
      <DocumentProvider api={api}>
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    expect(await screen.findByText("문서를 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(api.getDocumentVersion).toHaveBeenCalledTimes(2));
  });

  it("선택한 유형의 문서가 없으면 로딩 대신 빈 상태를 보여준다", async () => {
    const api = {
      listIntegrations: vi.fn().mockResolvedValue({ integrations: [] }),
      listDocuments: vi.fn().mockResolvedValue({
        documents: [{
          id: "resume-1",
          type: "RESUME",
          title: "이력서",
          latestVersionId: "resume-v1",
          versions: [{ id: "resume-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z", markdown: "# 이력서" }],
        }],
      }),
      getDocumentVersion: vi.fn(),
    };

    render(
      <DocumentProvider api={api}>
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    expect(await screen.findByText("이 유형의 문서가 아직 없어요.")).toBeInTheDocument();
    expect(screen.queryByText("문서를 불러오는 중이에요.")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이력서", level: 2 })).toBeInTheDocument();
  });
});
