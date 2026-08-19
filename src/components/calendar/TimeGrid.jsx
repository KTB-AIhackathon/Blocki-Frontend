// 주간 08시부터 20시까지의 시간 행과 일별 일정 열을 표시한다.
import { getMinutesFromMidnight, getWeekDates, toDateKey } from "../../domain/calendar/dateUtils";
import { groupCalendarItems } from "../../domain/calendar/calendarGroups";
import { BLOCK_DRAG_MIME, parseDragPayload } from "../../domain/calendar/dragPayload";
import CalendarBlock from "./CalendarBlock";

const START_MINUTES = 8 * 60;
const END_MINUTES = 20 * 60;

function getHourLabel(hour) {
  return hour < 12 ? `오전 ${hour}시` : `오후 ${hour === 12 ? 12 : hour - 12}시`;
}

export default function TimeGrid({
  weekStart,
  items,
  selectedOccurrenceId,
  onSelectOccurrence,
  onOpenDetail,
  onDragStart,
  onDropBlock,
}) {
  const dates = getWeekDates(weekStart);
  const groupsByDate = new Map();
  for (const group of groupCalendarItems(items)) {
    const date = toDateKey(group.startAt);
    const current = groupsByDate.get(date) ?? [];
    current.push(group);
    groupsByDate.set(date, current);
  }

  return (
    <div className="time-grid" aria-label="주간 일정표">
      <div className="time-axis">
        {Array.from({ length: 13 }, (_, index) => (
          <div className="time-row-label" key={index}>
            {getHourLabel(8 + index)}
          </div>
        ))}
      </div>
      <div className="day-columns">
        {dates.map((date) => (
          <div
            className="day-column"
            key={date}
            data-date={date}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const rawPayload =
                event.dataTransfer?.getData(BLOCK_DRAG_MIME) ?? event.dataTransfer?.getData("text/plain");
              const payload = parseDragPayload(rawPayload);
              if (!payload || !onDropBlock) {
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              const offsetY = Number.isFinite(event.dropMinutes)
                ? event.dropMinutes
                : START_MINUTES + ((event.clientY - rect.top) / 64) * 60;
              onDropBlock({ payload, dropDate: date, dropMinutes: offsetY });
            }}
          >
            {Array.from({ length: 13 }, (_, index) => (
              <div className="time-slot" key={index} data-minutes={START_MINUTES + index * 60} />
            ))}
            <div className="day-blocks">
              {(groupsByDate.get(date) ?? [])
                .filter((group) => {
                  const minutes = getMinutesFromMidnight(group.startAt);
                  return minutes >= START_MINUTES && minutes <= END_MINUTES;
                })
                .map((group) => (
                  <CalendarBlock
                    group={group}
                    key={`${group.visibleItem.occurrenceId}-${group.startAt}`}
                    selected={group.items.some((item) => item.occurrenceId === selectedOccurrenceId)}
                    onSelect={onSelectOccurrence}
                    onOpenDetail={onOpenDetail}
                    onDragStart={onDragStart}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
