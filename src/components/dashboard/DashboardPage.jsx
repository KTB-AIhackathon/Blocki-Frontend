// 연결 범위와 저장된 문서를 한 화면에서 확인하는 내 작업 대시보드다.
import { useAuth } from "../../state/AuthContext";
import { useDocumentWorkspace } from "../../state/DocumentContext";
import { navigateTo, ROUTES } from "../../routing/appRouter";
import DataNotice from "../common/DataNotice";
import Icon from "../common/Icon";
import ProviderLogo from "../common/ProviderLogo";
import DocumentTypeTabs from "../documents/DocumentTypeTabs";

const providerLabels = { GITHUB: "GitHub", NOTION: "Notion" };
const automationDayLabels = { MONDAY: "월요일" };

function formatAutomationSchedule(schedule = {}) {
  const day = automationDayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek ?? "월요일";
  const [hourValue, minuteValue] = (schedule.time ?? "21:00").split(":").map(Number);
  if (!Number.isFinite(hourValue)) {
    return `매주 ${day}`;
  }
  const period = hourValue >= 12 ? "오후" : "오전";
  const hour = hourValue % 12 || 12;
  const minute = Number.isFinite(minuteValue) && minuteValue > 0 ? ` ${minuteValue}분` : "";
  return `매주 ${day} · ${period} ${hour}시${minute}`;
}

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
    canRetryDataNotice,
    reload,
    connectIntegration,
    disconnectIntegration,
    pendingIntegrationProvider,
    generateDocument,
    pendingDocumentType,
    automation,
    pendingAutomation,
    updateDocumentGenerationAutomation,
    selectVersion,
  } = useDocumentWorkspace();
  const activeDocuments = documents.filter((document) => document.type === activeDocumentType);
  const activeDocumentVersions = activeDocuments
    .flatMap((document) => document.versions.map((version) => ({ document, version })))
    .sort((left, right) => new Date(right.version.createdAt) - new Date(left.version.createdAt));
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "작업자";
  const automationEnabled = automation?.enabled === true;
  const automationSchedule = formatAutomationSchedule(automation?.schedule);
  const canGenerateDocument = integrations.length === 2
    && integrations.every((integration) => integration.status === "CONNECTED");

  return (
    <div className="blocki-page dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <p className="page-kicker">MY WORK / 01</p>
          <h1>안녕하세요, {displayName}님.</h1>
          <p className="page-lede">오늘의 작업 기록을 나를 설명하는 문서로 정리해보세요.</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="document-automation-control">
            <div className="document-automation-copy">
              <strong>문서 자동화</strong>
              <span>{automationSchedule}</span>
            </div>
            <button
              aria-checked={automationEnabled}
              aria-label="문서 자동화"
              className={`document-automation-toggle ${automationEnabled ? "is-on" : ""}`}
              disabled={pendingAutomation}
              role="switch"
              title="서버 스케줄러가 설정된 시간에 문서를 생성합니다."
              type="button"
              onClick={() => updateDocumentGenerationAutomation(!automationEnabled)}
            >
              <span className="document-automation-toggle-track" aria-hidden="true">
                <span className="document-automation-toggle-thumb" />
              </span>
              <span className="document-automation-toggle-state">{pendingAutomation ? "저장 중…" : automationEnabled ? "켜짐" : "꺼짐"}</span>
            </button>
          </div>
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
              <div
                className={`integration-provider-mark is-${integration.provider.toLowerCase()}`}
                aria-hidden="true"
              >
                <ProviderLogo provider={integration.provider} />
              </div>
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
                    aria-label={pendingIntegrationProvider === integration.provider
                      ? `${providerLabels[integration.provider]} 연결 중`
                      : `${providerLabels[integration.provider]} 연결하기`}
                    className="integration-action-button"
                    disabled={pendingIntegrationProvider === integration.provider}
                    type="button"
                    onClick={() => connectIntegration(integration.provider)}
                  >
                    {pendingIntegrationProvider === integration.provider ? "연결 중…" : "연결하기"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="documents-panel" aria-labelledby="documents-heading">
        <div className="section-heading-row documents-heading-row">
          <div className="documents-heading-copy">
            <p className="section-kicker">DOCUMENTS</p>
            <h2 className="visually-hidden" id="documents-heading">문서 목록</h2>
          </div>
          <div className="document-generation-actions" aria-label="문서 생성">
            <button
              className="document-generation-button"
              disabled={!canGenerateDocument || pendingDocumentType !== null}
              type="button"
              onClick={() => generateDocument(activeDocumentType)}
            >
              {pendingDocumentType !== null ? "문서 생성 중…" : "문서 생성"}
            </button>
          </div>
        </div>
        <div className="document-tabs-row">
          <DocumentTypeTabs navigateOnChange={false} />
        </div>

        {dataNotice ? <DataNotice type={dataNotice} missingData={missingData} onRetry={canRetryDataNotice ? reload : undefined} /> : null}

        {activeDocumentVersions.length > 0 ? (
          <div className="document-list" key={activeDocumentType}>
            {activeDocumentVersions.map(({ document, version }) => {
              return (
                <article className="document-card" key={`${document.id}-${version.id}`}>
                  <div className="document-card-mark"><Icon name="file-text" size={22} /></div>
                  <div className="document-card-copy">
                    <p className="document-type-label">{document.type === "PORTFOLIO" ? "PORTFOLIO" : "RESUME"}</p>
                    <h3>{document.title} v{version.versionNumber}</h3>
                    <p>{version.id === document.latestVersionId ? "최신 버전" : "이전 버전"} · {formatDate(version.createdAt)}</p>
                  </div>
                  <button
                    className="button button-outline compact-button"
                    type="button"
                    onClick={() => {
                      selectVersion(document, version);
                      navigateTo(ROUTES.DOCUMENTS);
                    }}
                  >
                    문서 열기 <Icon name="arrow-up-right" size={14} />
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
