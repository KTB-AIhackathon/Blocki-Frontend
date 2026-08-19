// 포트폴리오와 이력서 문서 유형을 일관된 탭으로 전환한다.
import { DOCUMENT_TYPES } from "../../state/documentReducer";
import { useDocumentWorkspace } from "../../state/DocumentContext";
import { navigateTo, ROUTES } from "../../routing/appRouter";

const labels = {
  [DOCUMENT_TYPES.PORTFOLIO]: "포트폴리오",
  [DOCUMENT_TYPES.RESUME]: "이력서",
};

export default function DocumentTypeTabs() {
  const { activeDocumentType, setDocumentType } = useDocumentWorkspace();

  return (
    <div className="document-type-tabs" role="tablist" aria-label="문서 유형">
      {Object.values(DOCUMENT_TYPES).map((documentType) => (
        <button
          aria-selected={activeDocumentType === documentType}
          className={activeDocumentType === documentType ? "is-active" : ""}
          key={documentType}
          onClick={() => {
            setDocumentType(documentType);
            navigateTo(ROUTES.DOCUMENTS);
          }}
          role="tab"
          type="button"
        >
          {labels[documentType]}
        </button>
      ))}
    </div>
  );
}
