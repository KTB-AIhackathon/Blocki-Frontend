// 문서 탭·버전 선택과 안전한 Markdown 미리보기를 검증한다.
import { render, screen } from "@testing-library/react";
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
  };
}

describe("DocumentWorkspace", () => {
  it("포트폴리오와 이력서 문서를 탭으로 바꾸고 Markdown만 읽기 전용으로 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <DocumentProvider api={createDocumentApiDouble()} initialView="DOCUMENT">
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Blocki 프로젝트 포트폴리오", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /다운로드|편집/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "이력서" }));

    expect(await screen.findByRole("heading", { name: "Blocki 개발자 이력서", level: 1 })).toBeInTheDocument();
  });
});
