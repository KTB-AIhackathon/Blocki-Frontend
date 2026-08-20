// 자동화 시간 저장 완료를 알리는 확인 모달.
import Modal from "../common/Modal";

export default function AutomationSavedModal({ dayLabel, hour, minute = "00", onClose }) {
  const minuteLabel = Number(minute) > 0 ? ` ${Number(minute)}분` : "";
  return (
    <Modal title="자동화 시간 저장 완료" onClose={onClose} className="automation-saved-modal">
      <header className="automation-saved-modal-header">
        <div>
          <p className="eyebrow">AUTOMATION</p>
          <h2>저장했어요</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기">×</button>
      </header>
      <div className="automation-saved-modal-body">
        <p>
          매주 {dayLabel} {Number(hour)}시{minuteLabel}에 이력서와 포트폴리오를 자동으로 생성해요.
        </p>
        <button type="button" className="button button-primary" onClick={onClose}>
          확인
        </button>
      </div>
    </Modal>
  );
}
