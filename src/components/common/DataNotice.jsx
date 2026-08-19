// 기록 부족과 일부 조회 실패를 같은 시각 언어로 안내한다.
const providerLabels = { GITHUB: "GitHub", NOTION: "Notion" };

export default function DataNotice({ type, missingData = [], onRetry }) {
  if (!type) {
    return null;
  }

  const isPartial = type === "PARTIAL_DATA";
  return (
    <section className={`data-notice ${isPartial ? "is-partial" : "is-insufficient"}`} role="status">
      <div className="data-notice-icon" aria-hidden="true">{isPartial ? "!" : "○"}</div>
      <div className="data-notice-copy">
        <strong>{isPartial ? "누락된 데이터가 있어요" : "오늘 기록이 부족합니다"}</strong>
        <p>
          {isPartial
            ? "일부 연결 데이터 없이 문서를 만들었어요. 아래 항목을 확인해주세요."
            : "새 버전은 만들지 않고 기존 문서를 그대로 유지했어요."}
        </p>
        {missingData.length > 0 ? (
          <ul>
            {missingData.map((item, index) => {
              const label = typeof item === "string" ? item : `${providerLabels[item.provider] ?? item.provider}: ${item.reason}`;
              return <li key={`${label}-${index}`}>{label}</li>;
            })}
          </ul>
        ) : null}
      </div>
      {onRetry ? (
        <button className="text-button" type="button" onClick={onRetry}>
          다시 시도
        </button>
      ) : null}
    </section>
  );
}
