// 왼쪽 선택에 따라 중앙 달력 또는 블록 보관함을 표시한다.
import BlockStorage from "../storage/BlockStorage";
import WeekCalendar from "../calendar/WeekCalendar";
import MonthOverlay from "../calendar/MonthOverlay";
import BlockDetailModal from "../calendar/BlockDetailModal";
import { useWorkspace } from "../../state/WorkspaceContext";

export default function WorkspacePanel() {
  const {
    view,
    weekStart,
    calendarItems,
    selectedOccurrenceId,
    monthOverlayOpen,
    detailTarget,
    setWeek,
    openMonthOverlay,
    closeMonthOverlay,
    selectOccurrence,
    openDetail,
    closeDetail,
    moveBlockOnDrop,
  } = useWorkspace();

  if (view === "STORAGE") {
    return <BlockStorage />;
  }

  return (
    <>
      <WeekCalendar
        weekStart={weekStart}
        items={calendarItems}
        selectedOccurrenceId={selectedOccurrenceId}
        onWeekChange={setWeek}
        onOpenMonth={openMonthOverlay}
        onSelectOccurrence={selectOccurrence}
        onOpenDetail={openDetail}
        onDropBlock={moveBlockOnDrop}
      />
      {monthOverlayOpen ? (
        <MonthOverlay
          anchorDate={weekStart}
          onSelectDate={(date) => {
            closeMonthOverlay();
            setWeek(date);
          }}
          onClose={closeMonthOverlay}
        />
      ) : null}
      {detailTarget ? (
        <BlockDetailModal
          detail={detailTarget.detail}
          relatedItems={detailTarget.relatedItems}
          onClose={closeDetail}
        />
      ) : null}
    </>
  );
}
