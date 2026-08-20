// GFM 표가 HTML 표로 렌더링되는지 검증한다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownPreview from "./MarkdownPreview";

describe("MarkdownPreview", () => {
  it("파이프 표를 칸이 나뉜 HTML 표로 보여준다", () => {
    render(
      <MarkdownPreview markdown={[
        "| 저장소 | 점수 | 주요 근거 |",
        "|---|---:|---|",
        "| clx-skillbook | 16.8 | 커밋 13 · 최근 활동 |",
        "| ~~WordList_web~~ | 11.4 | 커밋 1 · 최근 활동 |",
      ].join("\n")}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "저장소" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "점수" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "16.8" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "WordList_web" })).toBeInTheDocument();
  });
});
