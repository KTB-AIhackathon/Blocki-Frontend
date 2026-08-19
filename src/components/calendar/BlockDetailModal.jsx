// 선택한 일정의 시간·수행 동작·원문 prompt를 상세 모달에 표시한다.
import Modal from "../common/Modal";
import { formatTime } from "../../domain/calendar/dateUtils";

export default function BlockDetailModal({ detail, relatedItems = [], onClose }) {
  if (!detail) {
    return null;
  }

  const actions = detail.actions ?? [];
  const items = relatedItems.length > 0 ? relatedItems : [detail];

  return (
    <Modal title={`${detail.name} 상세 정보`} onClose={onClose} className="detail-modal">
      <header className="detail-modal-header">
        <div>
          <p className="eyebrow">SELECTED AUTOMATION</p>
          <h2>{detail.name}</h2>
          <p className="detail-time">
            {formatTime(detail.startAt)}–{formatTime(detail.endAt)}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="상세 닫기">×</button>
      </header>
      <div className="detail-modal-body">
        {items.length > 1 ? (
          <div className="related-items">
            <strong>같은 시간대 작업 {items.length}개</strong>
            <ul>
              {items.map((item) => <li key={item.blockId}>{item.name}</li>)}
            </ul>
          </div>
        ) : null}
        <section>
          <h3>수행할 동작</h3>
          <ul className="action-list">
            {actions.length > 0 ? actions.map((action) => (
              <li key={`${action.title}-${action.description}`}>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </li>
            )) : <li><strong>{detail.actionSummary ?? "자동화 작업"}</strong></li>}
          </ul>
        </section>
        <section>
          <h3>에이전트에 입력한 prompt</h3>
          <p className="source-prompt">{detail.prompt ?? "원문 prompt가 없습니다."}</p>
        </section>
        <div className="detail-status-row">
          <span>연결 {detail.connectionStatus ?? "확인 중"}</span>
          <span>최근 실행 {detail.latestRunStatus ?? "없음"}</span>
        </div>
      </div>
    </Modal>
  );
}
