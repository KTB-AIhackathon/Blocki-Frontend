// 문서 API의 목록·버전 조회 경로와 화면 데이터 변환을 검증한다.
import { describe, expect, it, vi } from "vitest";
import { createDocumentApi } from "./documentApi";

describe("document API specification", () => {
  it("문서 목록과 각 문서의 버전 목록을 조회한다", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { items: [{ id: "doc-1", type: "RESUME", title: "이력서", latestVersion: { id: "version-2", version: 2, createdAt: "2026-08-19T09:00:00Z" } }], page: { number: 0 }, notice: "PARTIAL_DATA", missingData: [{ provider: "NOTION", reason: "조회 실패" }] } })
      .mockResolvedValueOnce({ data: { items: [{ id: "version-1", version: 1, createdAt: "2026-08-18T09:00:00Z" }, { id: "version-2", version: 2, createdAt: "2026-08-19T09:00:00Z" }] } });
    const api = createDocumentApi({ request });

    await expect(api.listDocuments({ type: "RESUME" })).resolves.toMatchObject({
      documents: [{ id: "doc-1", latestVersionId: "version-2", versions: [{ versionNumber: 1 }, { versionNumber: 2 }] }],
      dataNotice: "PARTIAL_DATA",
      missingData: [{ provider: "NOTION", reason: "조회 실패" }],
    });
    expect(request).toHaveBeenNthCalledWith(1, "/documents?type=RESUME&page=0&size=20&sort=latestVersionCreatedAt%2CDESC");
    expect(request).toHaveBeenNthCalledWith(2, "/documents/doc-1/versions?page=0&size=100&sort=version%2CASC");
  });

  it("특정 버전 조회 결과를 Markdown 미리보기 구조로 변환한다", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "doc-1", type: "RESUME", title: "이력서", version: 2, markdown: "# 이력서", createdAt: "2026-08-19T09:00:00Z" } });
    const api = createDocumentApi({ request });

    await expect(api.getDocumentVersion("doc-1", "version-1")).resolves.toMatchObject({ id: "version-1", markdown: "# 이력서", versionNumber: 2 });
    expect(request).toHaveBeenCalledWith("/documents/doc-1/versions/version-1");
  });

  it("문서 유형별 생성 작업을 요청하고 작업 상태를 조회한다", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { id: "job-1", status: "QUEUED", type: "DOCUMENT_GENERATION" } })
      .mockResolvedValueOnce({ data: { id: "job-1", status: "SUCCEEDED", documentId: "doc-1", versionId: "version-2" } });
    const api = createDocumentApi({ request });

    await expect(api.generateDocument("RESUME", "request-key-1")).resolves.toMatchObject({
      id: "job-1",
      status: "QUEUED",
    });
    await expect(api.getDocumentGeneration("job-1")).resolves.toMatchObject({
      status: "SUCCEEDED",
      versionId: "version-2",
    });

    expect(request).toHaveBeenNthCalledWith(1, "/documents/generations", {
      method: "POST",
      body: { type: "RESUME" },
      idempotencyKey: "request-key-1",
    });
    expect(request).toHaveBeenNthCalledWith(2, "/document-generation-jobs/job-1");
  });
});
