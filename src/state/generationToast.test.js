import { describe, expect, it } from "vitest";
import { generationToast } from "./generationToast";

describe("generationToast", () => {
  it("says the document was created when only fill-in fields are blank", () => {
    expect(generationToast("RESUME", "PARTIALLY_SUCCEEDED", [])).toBe(
      "이력서를 만들었어요. 비어 있는 칸은 노션에서 채워 주세요.",
    );
  });

  it("keeps the missing-data copy when a source actually failed", () => {
    expect(generationToast("PORTFOLIO", "PARTIALLY_SUCCEEDED", ["GITHUB"])).toBe(
      "문서를 생성했지만 일부 데이터가 누락됐어요.",
    );
  });

  it("says success when the job fully succeeded", () => {
    expect(generationToast("PORTFOLIO", "SUCCEEDED")).toBe("포트폴리오를 생성했어요.");
  });
});
