// 로그인 사용자 정보와 외부 소스 연결 상태를 읽기 전용으로 표시한다.
import { useAuth } from "../../state/AuthContext";
import { useDocumentWorkspace } from "../../state/DocumentContext";

const providerLabels = { GITHUB: "GitHub", NOTION: "Notion" };

export default function IntegrationSettings() {
  const { user } = useAuth();
  const {
    connectIntegration,
    disconnectIntegration,
    integrations,
    pendingIntegrationProvider,
  } = useDocumentWorkspace();

  return (
    <div className="blocki-page settings-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">SETTINGS</p>
          <h1>설정</h1>
          <p className="page-lede">내 계정 정보와 문서에 반영되는 데이터 소스를 확인하세요.</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="settings-section" aria-labelledby="user-info-heading">
          <div className="settings-section-heading">
            <p className="section-kicker">ACCOUNT</p>
            <h2 id="user-info-heading">사용자 정보</h2>
          </div>
          <dl className="settings-user-list">
            <div>
              <dt>이름</dt>
              <dd>{user?.name ?? "이름 정보 없음"}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{user?.email ?? "이메일 정보 없음"}</dd>
            </div>
          </dl>
        </section>

        <section className="settings-section" aria-labelledby="source-status-heading">
          <div className="settings-section-heading">
            <p className="section-kicker">SOURCES</p>
            <h2 id="source-status-heading">소스 연동 상태</h2>
          </div>
          <div className="settings-integration-list">
            {integrations.map((integration) => {
              const label = providerLabels[integration.provider];
              const connected = integration.status === "CONNECTED";
              return (
                <div className={`settings-integration-card ${connected ? "is-connected" : ""}`} key={integration.provider}>
                  <div className="integration-provider-mark" aria-hidden="true">{integration.provider === "GITHUB" ? "GH" : "N"}</div>
                  <div className="settings-integration-copy">
                    <strong>{label}</strong>
                    <span>{connected ? integration.accountLabel ?? "연결된 계정" : "연결 안 됨"}</span>
                  </div>
                  {connected ? (
                    <button
                      aria-label={pendingIntegrationProvider === integration.provider
                        ? `${label} 연결 해제 중`
                        : `${label} 연결됨, 눌러서 연결 해제`}
                      className="integration-action-button is-connected"
                      disabled={pendingIntegrationProvider === integration.provider}
                      type="button"
                      onClick={() => disconnectIntegration(integration.provider)}
                    >
                      {pendingIntegrationProvider === integration.provider ? "해제 중…" : "연결됨"}
                    </button>
                  ) : (
                    <button
                      aria-label={pendingIntegrationProvider === integration.provider ? `${label} 연결 중` : `${label} 연결하기`}
                      className="integration-action-button"
                      disabled={pendingIntegrationProvider === integration.provider}
                      type="button"
                      onClick={() => connectIntegration(integration.provider)}
                    >
                      {pendingIntegrationProvider === integration.provider ? "연결 중…" : "연결하기"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
