// 문서 워크스페이스 reducer의 연결 범위·버전·데이터 상태 계약을 검증한다.
import { describe, expect, it } from "vitest";
import {
  DOCUMENT_TYPES,
  createInitialDocumentState,
  documentReducer,
  getConnectedIntegrations,
} from "./documentReducer";

const baseIntegrations = [
  { provider: "GITHUB", status: "CONNECTED", itemCount: 4 },
  { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
];

const baseDocument = {
  id: "doc-portfolio",
  type: DOCUMENT_TYPES.PORTFOLIO,
  title: "포트폴리오",
  latestVersionId: "portfolio-v1",
  versions: [{ id: "portfolio-v1", versionNumber: 1, createdAt: "2026-08-18T09:00:00Z" }],
};

describe("documentReducer", () => {
  it("연동 조회 결과가 없어도 GitHub와 Notion 연결 항목을 유지한다", () => {
    const state = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: [],
      documents: [],
    });

    expect(state.integrations).toEqual([
      { provider: "GITHUB", status: "DISCONNECTED", itemCount: 0 },
      { provider: "NOTION", status: "DISCONNECTED", itemCount: 0 },
    ]);
  });

  it("연결된 서비스만 현재 수집 범위로 반환한다", () => {
    const state = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: baseIntegrations,
      documents: [baseDocument],
    });

    expect(getConnectedIntegrations(state)).toEqual([baseIntegrations[0]]);
  });

  it("포트폴리오와 이력서 탭을 전환한다", () => {
    const state = documentReducer(createInitialDocumentState(), {
      type: "SET_DOCUMENT_TYPE",
      documentType: DOCUMENT_TYPES.RESUME,
    });

    expect(state.activeDocumentType).toBe(DOCUMENT_TYPES.RESUME);
  });

  it("조회 응답의 최신 문서 버전을 선택한다", () => {
    const loaded = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: baseIntegrations,
      documents: [baseDocument],
    });
    expect(loaded.selectedDocumentId).toBe("doc-portfolio");
    expect(loaded.selectedVersionId).toBe("portfolio-v1");
  });

  it("기록 부족 조회 결과는 기존 문서와 전용 안내를 함께 보존한다", () => {
    const next = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: baseIntegrations,
      documents: [baseDocument],
      dataNotice: "INSUFFICIENT_DATA",
      missingData: ["오늘 기록"],
    });

    expect(next.documents).toEqual([baseDocument]);
    expect(next.dataNotice).toBe("INSUFFICIENT_DATA");
    expect(next.missingData).toEqual(["오늘 기록"]);
  });

  it("일부 데이터 조회 실패는 문서와 누락 안내를 함께 보존한다", () => {
    const next = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: baseIntegrations,
      documents: [baseDocument],
      dataNotice: "PARTIAL_DATA",
      missingData: [{ provider: "NOTION", reason: "페이지 조회 실패" }],
    });

    expect(next.documents).toEqual([baseDocument]);
    expect(next.dataNotice).toBe("PARTIAL_DATA");
    expect(next.missingData[0].provider).toBe("NOTION");
  });

  it("문서 탭을 바꿔도 누락 데이터 안내를 초기화하지 않는다", () => {
    const loaded = documentReducer(createInitialDocumentState(), {
      type: "LOAD_SUCCESS",
      integrations: baseIntegrations,
      documents: [baseDocument],
      dataNotice: "PARTIAL_DATA",
      missingData: [{ provider: "NOTION", reason: "연결되지 않음" }],
    });

    const next = documentReducer(loaded, {
      type: "SET_DOCUMENT_TYPE",
      documentType: DOCUMENT_TYPES.RESUME,
    });

    expect(next.dataNotice).toBe("PARTIAL_DATA");
    expect(next.missingData).toEqual([{ provider: "NOTION", reason: "연결되지 않음" }]);
  });
});
