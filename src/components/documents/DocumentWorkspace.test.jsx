// 문서 탭·버전 선택과 안전한 Markdown 미리보기를 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DocumentWorkspace from "./DocumentWorkspace";
import { DocumentProvider } from "../../state/DocumentContext";
import { createDocumentMockApi } from "../../mock/documentMockApi";

describe("DocumentWorkspace", () => {
  it("포트폴리오와 이력서 문서를 탭으로 바꾸고 Markdown만 읽기 전용으로 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <DocumentProvider api={createDocumentMockApi()} initialView="DOCUMENT">
        <DocumentWorkspace />
      </DocumentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Blocki 프로젝트 포트폴리오" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /다운로드|편집/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "이력서" }));

    expect(await screen.findByRole("heading", { name: "Blocki 개발자 이력서" })).toBeInTheDocument();
  });
});
