// 같은 시간대에 숨겨진 추가 일정의 개수를 작은 요약으로 표시한다.
export default function OverlapSummary({ hiddenCount }) {
  if (!hiddenCount) {
    return null;
  }

  return <span className="overlap-summary">작업 외 {hiddenCount}개</span>;
}
