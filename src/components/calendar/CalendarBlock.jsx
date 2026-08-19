// 달력 안의 일정 블록을 선택·상세 열기 가능한 카드로 표시한다.
import { formatTime, getMinutesFromMidnight } from "../../domain/calendar/dateUtils";
import { BLOCK_DRAG_MIME, createDragPayload } from "../../domain/calendar/dragPayload";
import OverlapSummary from "./OverlapSummary";

export default function CalendarBlock({
  group,
  selected,
  onSelect,
  onOpenDetail,
  onDragStart,
}) {
  const item = group.visibleItem;
  const topMinutes = getMinutesFromMidnight(item.startAt) - 8 * 60;
  const handleDragStart = (event) => {
    const payload = createDragPayload({
      occurrenceId: item.occurrenceId,
      blockId: item.blockId,
      source: "CALENDAR",
    });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(BLOCK_DRAG_MIME, payload);
    event.dataTransfer.setData("text/plain", payload);
    onDragStart?.(event, item);
  };
  const handleClick = (event) => {
    onSelect(item.occurrenceId);
    if (group.hiddenCount && event.target.closest(".overlap-summary")) {
      onOpenDetail(group.items);
    }
  };

  return (
    <button
      className={`calendar-block type-${item.type?.toLowerCase() ?? "default"} ${selected ? "is-selected" : ""}`}
      type="button"
      style={{
        top: `${Math.max(0, (topMinutes / 60) * 64)}px`,
      }}
      aria-label={`${item.name} ${formatTime(item.startAt)}${group.hiddenCount ? `, 작업 외 ${group.hiddenCount}개` : ""}`}
      onClick={handleClick}
      onDoubleClick={() => onOpenDetail(group.items)}
      draggable
      onDragStart={handleDragStart}
    >
      <strong>{item.name}</strong>
      <span>{formatTime(item.startAt)}</span>
      <OverlapSummary hiddenCount={group.hiddenCount} />
    </button>
  );
}
