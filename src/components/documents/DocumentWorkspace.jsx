// 문서 트리와 읽기 전용 Markdown 미리보기를 조합하는 문서 작업 화면이다.
import { useDocumentWorkspace } from "../../state/DocumentContext";
import { navigateTo, ROUTES } from "../../routing/appRouter";
import DataNotice from "../common/DataNotice";
import DocumentTypeTabs from "./DocumentTypeTabs";
import MarkdownPreview from "./MarkdownPreview";

function formatVersionDate(value) {
  return value ? new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value)) : "";
}

export default function DocumentWorkspace() {
  const {
    documents,
    activeDocumentType,
    selectedDocumentId,
    selectedVersionId,
    selectedVersion,
    dataNotice,
    missingData,
    reload,
    selectVersion,
  } = useDocumentWorkspace();
  const activeDocument = documents.find((document) => document.type === activeDocumentType);

  return (
    <div className="blocki-page document-page">
      <header className="page-header document-page-header">
        <div>
          <button className="back-link" type="button" onClick={() => navigateTo(ROUTES.WORKSPACE)}>← 내 작업</button>
          <p className="page-kicker">DOCUMENT ARCHIVE</p>
          <h1>{activeDocument?.title ?? (activeDocumentType === "PORTFOLIO" ? "포트폴리오" : "이력서")}</h1>
        </div>
        <DocumentTypeTabs />
      </header>

      {dataNotice ? <DataNotice type={dataNotice} missingData={missingData} onRetry={reload} /> : null}

      <div className="document-layout">
        <aside className="document-tree" aria-label="문서 버전 목록">
          <div className="document-tree-heading">
            <p className="section-kicker">ARCHIVE</p>
            <strong>문서 버전</strong>
          </div>
          {documents.length === 0 ? <p className="tree-empty">아직 저장된 문서가 없어요.</p> : null}
          {documents.map((document) => (
            <section className={`tree-document ${document.id === selectedDocumentId ? "is-active" : ""}`} key={document.id}>
              <h2>{document.title}</h2>
              <div className="tree-version-list">
                {document.versions.map((version) => (
                  <button
                    className={document.id === selectedDocumentId && version.id === selectedVersionId ? "is-active" : ""}
                    key={version.id}
                    type="button"
                    onClick={() => selectVersion(document, version)}
                  >
                    <span>v{version.versionNumber}</span>
                    <time dateTime={version.createdAt}>{formatVersionDate(version.createdAt)}</time>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <section className="document-preview-panel" aria-label="Markdown 미리보기">
          <div className="document-preview-toolbar">
            <span className="read-only-label"><span aria-hidden="true">◉</span> 읽기 전용 미리보기</span>
            {selectedVersion ? <span>v{selectedVersion.versionNumber} · {formatVersionDate(selectedVersion.createdAt)}</span> : null}
          </div>
          {selectedVersion ? <MarkdownPreview markdown={selectedVersion.markdown} /> : <p className="empty-document">문서를 불러오는 중이에요.</p>}
        </section>
      </div>
    </div>
  );
}
