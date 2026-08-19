// 왼쪽 패널에 대화 세션 목록과 선택 상태를 표시한다.
import { formatTime } from "../../domain/calendar/dateUtils";
import { useWorkspace } from "../../state/WorkspaceContext";

export default function SessionList() {
  const { sessions, selectedSessionId, selectSession } = useWorkspace();

  return (
    <section className="session-section" aria-labelledby="session-list-title">
      <div className="section-heading">
        <h2 id="session-list-title">대화 세션</h2>
        <span>{sessions.length}</span>
      </div>
      <div className="session-list">
        {sessions.map((session) => (
          <button
            className={`session-item ${selectedSessionId === session.id ? "is-active" : ""}`}
            key={session.id}
            type="button"
            onClick={() => selectSession(session.id)}
            aria-label={`대화 세션: ${session.title}`}
          >
            <span className="session-icon" aria-hidden="true">✦</span>
            <span className="session-copy">
              <strong>{session.title}</strong>
              <span>{session.preview}</span>
            </span>
            <time dateTime={session.updatedAt}>{formatTime(session.updatedAt)}</time>
          </button>
        ))}
      </div>
    </section>
  );
}
