// 자동화 생성 상태를 사용자 메시지와 재시도 버튼으로 표시한다.
const STATUS_LABELS = {
  QUEUED: "생성 대기 중이에요.",
  RUNNING: "자동화 계획을 만드는 중이에요…",
  SUCCEEDED: "일정을 업데이트했어요.",
  NEEDS_INPUT: "추가 정보가 필요해요.",
  UNSUPPORTED: "아직 지원하지 않는 작업이에요.",
  FAILED: "생성에 실패했어요.",
};

export default function GenerationStatus({ generation, onRetry }) {
  if (!generation) {
    return null;
  }

  return (
    <div className={`generation-status status-${generation.status.toLowerCase()}`} role="status">
      <span>
        {generation.status === "FAILED"
          ? generation.errorMessage ?? STATUS_LABELS.FAILED
          : STATUS_LABELS[generation.status] ?? "처리 중이에요."}
      </span>
      {generation.status === "FAILED" ? (
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
