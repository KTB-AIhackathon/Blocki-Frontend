// 문서 트리와 읽기 전용 Markdown 미리보기를 조합하는 문서 작업 화면이다.
import { useState } from "react";
import { useDocumentWorkspace } from "../../state/DocumentContext";
import { navigateTo, ROUTES } from "../../routing/appRouter";
import DataNotice from "../common/DataNotice";
import Icon from "../common/Icon";
import MarkdownPreview from "./MarkdownPreview";

function formatVersionDate(value) {
  return value ? new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value)) : "";
}

function formatDownloadFilename(title, versionNumber) {
  const safeTitle = (title ?? "document")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim()
    .replace(/\s+/g, "-") || "document";
  return `${safeTitle}-v${versionNumber ?? "latest"}.pdf`;
}

function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export default function DocumentWorkspace() {
  const [pendingDownload, setPendingDownload] = useState(false);
  const {
    documents,
    activeDocumentType,
    selectedDocumentId,
    selectedVersionId,
    selectedVersion,
    dataNotice,
    missingData,
    canRetryDataNotice,
    reload,
    selectVersion,
    downloadDocumentVersionPdf,
  } = useDocumentWorkspace();
  const activeDocument = documents.find((document) => document.type === activeDocumentType);

  const handleDownload = async () => {
    if (!selectedDocumentId || !selectedVersionId || pendingDownload) {
      return;
    }
    setPendingDownload(true);
    try {
      const pdf = await downloadDocumentVersionPdf(selectedDocumentId, selectedVersionId);
      if (pdf) {
        triggerBlobDownload(pdf, formatDownloadFilename(activeDocument?.title, selectedVersion?.versionNumber));
      }
    } finally {
      setPendingDownload(false);
    }
  };

  return (
    <div className="blocki-page document-page">
      <header className="page-header document-page-header">
        <div>
          <button className="back-link" type="button" onClick={() => navigateTo(ROUTES.WORKSPACE)}><Icon name="arrow-left" size={16} /> 내 작업</button>
          <p className="page-kicker">DOCUMENT ARCHIVE</p>
          <h1>{activeDocument?.title ?? (activeDocumentType === "PORTFOLIO" ? "포트폴리오" : "이력서")}</h1>
        </div>
      </header>

      {dataNotice ? <DataNotice type={dataNotice} missingData={missingData} onRetry={canRetryDataNotice ? reload : undefined} /> : null}

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
            <span className="read-only-label"><Icon name="eye" size={15} /> 읽기 전용 미리보기</span>
            <div className="document-preview-actions">
              {selectedVersion ? <span>v{selectedVersion.versionNumber} · {formatVersionDate(selectedVersion.createdAt)}</span> : null}
              <button
                aria-label="PDF 다운로드"
                className="button button-outline compact-button document-download-button"
                disabled={!selectedDocumentId || !selectedVersionId || pendingDownload}
                title={pendingDownload ? "PDF를 준비하고 있어요." : "선택한 문서 버전을 PDF로 다운로드합니다."}
                type="button"
                onClick={handleDownload}
              >
                <Icon name="file-text" size={14} /> {pendingDownload ? "다운로드 중…" : "PDF 다운로드"}
              </button>
            </div>
          </div>
          {selectedVersion ? <MarkdownPreview markdown={selectedVersion.markdown} /> : <p className="empty-document">문서를 불러오는 중이에요.</p>}
        </section>
      </div>
    </div>
  );
}
