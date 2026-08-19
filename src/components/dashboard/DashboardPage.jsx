// 연결 범위와 저장된 문서를 한 화면에서 확인하는 내 작업 대시보드다.
import { useAuth } from "../../state/AuthContext";
import { useDocumentWorkspace } from "../../state/DocumentContext";
import { navigateTo, ROUTES } from "../../routing/appRouter";
import DataNotice from "../common/DataNotice";
import DocumentTypeTabs from "../documents/DocumentTypeTabs";

const providerLabels = { GITHUB: "GitHub", NOTION: "Notion" };

function formatDate(value) {
  if (!value) {
    return "아직 없음";
  }
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    integrations,
    connectedCount,
    documents,
    activeDocumentType,
    dataNotice,
    missingData,
    reload,
    connectIntegration,
    disconnectIntegration,
    pendingIntegrationProvider,
    selectVersion,
  } = useDocumentWorkspace();
  const activeDocuments = documents.filter((document) => document.type === activeDocumentType);
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "작업자";

  return (
    <div className="blocki-page dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <p className="page-kicker">MY WORK / 01</p>
          <h1>안녕하세요, {displayName}님.</h1>
          <p className="page-lede">오늘의 작업 기록을 나를 설명하는 문서로 정리해보세요.</p>
        </div>
      </header>

      <section className="scope-panel" aria-labelledby="scope-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">COLLECTION SCOPE</p>
            <h2 id="scope-heading">연결된 서비스가 현재 수집 범위예요.</h2>
          </div>
          <strong className="scope-count">{connectedCount}개 연결됨</strong>
        </div>
        <div className="integration-summary-grid">
          {integrations.map((integration) => (
            <div className={`integration-summary-card ${integration.status === "CONNECTED" ? "is-connected" : ""}`} key={integration.provider}>
              <div className="integration-provider-mark" aria-hidden="true">{integration.provider === "GITHUB" ? "GH" : "N"}</div>
              <div>
                <strong>{providerLabels[integration.provider]}</strong>
                <span>{integration.status === "CONNECTED"
                  ? integration.itemCount > 0 ? `${integration.itemCount}개 기록 수집 가능` : "연결된 기록 수집 가능"
                  : "연결 안 됨"}</span>
              </div>
              <div className="integration-action-slot">
                {integration.status === "CONNECTED" ? (
                  <button
                    aria-label={pendingIntegrationProvider === integration.provider
                      ? `${providerLabels[integration.provider]} 연결 해제 중`
                      : `${providerLabels[integration.provider]} 연결됨, 눌러서 연결 해제`}
                    className="integration-action-button is-connected"
                    disabled={pendingIntegrationProvider === integration.provider}
                    type="button"
                    onClick={() => disconnectIntegration(integration.provider)}
                  >
                    {pendingIntegrationProvider === integration.provider ? "해제 중…" : "연결됨"}
                  </button>
                ) : (
                  <button
                    aria-label={`${providerLabels[integration.provider]} 연결하기`}
                    className="integration-action-button"
                    type="button"
                    onClick={() => connectIntegration(integration.provider)}
                  >
                    연결하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {dataNotice ? <DataNotice type={dataNotice} missingData={missingData} onRetry={reload} /> : null}

      <section className="documents-panel" aria-labelledby="documents-heading">
        <div className="section-heading-row documents-heading-row">
          <div>
            <p className="section-kicker">DOCUMENTS</p>
            <h2 id="documents-heading">나의 문서</h2>
          </div>
          <DocumentTypeTabs />
        </div>

        {activeDocuments.length > 0 ? (
          <div className="document-list" key={activeDocumentType}>
            {activeDocuments.map((document) => {
              const latestVersion = document.versions.find((item) => item.id === document.latestVersionId) ?? document.versions.at(-1);
              return (
                <article className="document-card" key={document.id}>
                  <div className="document-card-mark" aria-hidden="true">{document.type === "PORTFOLIO" ? "✦" : "↗"}</div>
                  <div className="document-card-copy">
                    <p className="document-type-label">{document.type === "PORTFOLIO" ? "PORTFOLIO" : "RESUME"}</p>
                    <h3>{document.title}</h3>
                    <p>최근 버전 v{latestVersion?.versionNumber ?? 1} · {formatDate(latestVersion?.createdAt)}</p>
                  </div>
                  <button
                    className="button button-outline compact-button"
                    type="button"
                    onClick={() => {
                      if (latestVersion) {
                        selectVersion(document, latestVersion);
                        navigateTo(ROUTES.DOCUMENTS);
                      }
                    }}
                  >
                    문서 열기 <span aria-hidden="true">↗</span>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-document-card">
            <strong>아직 {activeDocumentType === "PORTFOLIO" ? "포트폴리오" : "이력서"}가 없어요.</strong>
            <p>연결된 서비스에서 문서가 생성되면 이곳에 표시돼요.</p>
          </div>
        )}

        <p className="dashboard-footnote">연동된 데이터에서 만들어진 문서는 기존 버전과 함께 보관돼요.</p>
      </section>
    </div>
  );
}
