// 문서 Mock API가 문서 조회 결과와 데이터 상태를 반환하는지 검증한다.
import { describe, expect, it } from "vitest";
import { createDocumentMockApi } from "./documentMockApi";

describe("document mock api", () => {
  it("문서 목록과 최종 Markdown 버전을 조회한다", async () => {
    const api = createDocumentMockApi();
    const result = await api.listDocuments();
    const version = await api.getDocumentVersion(result.documents[0].id, result.documents[0].latestVersionId);

    expect(version.markdown).toContain("#");
    expect(version).not.toHaveProperty("sources");
    expect(version).not.toHaveProperty("extraction");
  });

  it("기록 부족 상태에서는 새 Markdown을 만들지 않는다", async () => {
    const api = createDocumentMockApi({ scenario: "INSUFFICIENT_DATA" });
    const result = await api.listDocuments();

    expect(result.dataNotice).toBe("INSUFFICIENT_DATA");
    expect(result.missingData).toEqual(["오늘 기록"]);
  });

  it("일부 조회 실패 상태에서는 최종 Markdown과 누락 정보를 함께 반환한다", async () => {
    const api = createDocumentMockApi({ scenario: "PARTIAL_DATA" });
    const result = await api.listDocuments();

    expect(result.dataNotice).toBe("PARTIAL_DATA");
    expect(result.missingData).toEqual([
      { provider: "NOTION", reason: "페이지 조회에 실패했습니다." },
    ]);
  });
});
