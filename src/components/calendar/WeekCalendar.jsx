// 주간 헤더·시간표·일정 상호작용을 하나의 달력 화면으로 조합한다.
import WeekHeader from "./WeekHeader";
import TimeGrid from "./TimeGrid";

export default function WeekCalendar({
  weekStart,
  items,
  selectedOccurrenceId,
  onWeekChange,
  onOpenMonth,
  onSelectOccurrence,
  onOpenDetail,
  onDragStart,
  onDropBlock,
}) {
  return (
    <section className="week-calendar" aria-label="주간 캘린더">
      <WeekHeader weekStart={weekStart} onWeekChange={onWeekChange} onOpenMonth={onOpenMonth} />
      <TimeGrid
        weekStart={weekStart}
        items={items}
        selectedOccurrenceId={selectedOccurrenceId}
        onSelectOccurrence={onSelectOccurrence}
        onOpenDetail={onOpenDetail}
        onDragStart={onDragStart}
        onDropBlock={onDropBlock}
      />
    </section>
  );
}
