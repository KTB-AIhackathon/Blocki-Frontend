// 주간 달력의 월 제목·주 이동·오늘·월간 overlay 진입을 표시한다.
import {
  addWeeks,
  formatMonthDay,
  formatMonthTitle,
  getMondayWeekStart,
  getWeekDates,
} from "../../domain/calendar/dateUtils";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function WeekHeader({ weekStart, onWeekChange, onOpenMonth }) {
  const dates = getWeekDates(weekStart);
  const range = `${formatMonthDay(dates[0])} — ${formatMonthDay(dates[6])}`;

  return (
    <header className="week-header">
      <div className="week-navigation">
        <button type="button" onClick={() => onWeekChange(addWeeks(weekStart, -1))} aria-label="이전 주">
          ‹
        </button>
        <button className="month-title-button" type="button" onClick={onOpenMonth} aria-label="월간 캘린더">
          <strong>{formatMonthTitle(weekStart)}</strong>
          <span>{range}</span>
        </button>
        <button type="button" onClick={() => onWeekChange(addWeeks(weekStart, 1))} aria-label="다음 주">
          ›
        </button>
        <button className="today-button" type="button" onClick={() => onWeekChange(getMondayWeekStart(new Date()))}>
          오늘
        </button>
      </div>
      <div className="week-days" aria-label="주간 날짜">
        {dates.map((date, index) => (
          <div className="week-day" key={date}>
            <span>{DAY_LABELS[index]}</span>
            <strong>{date.slice(8)}</strong>
          </div>
        ))}
      </div>
    </header>
  );
}
