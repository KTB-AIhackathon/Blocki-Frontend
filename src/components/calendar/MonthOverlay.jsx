// 중앙 달력 위에 표시되는 C 방식 월간 날짜 선택 overlay를 제공한다.
import Modal from "../common/Modal";
import { addDays, formatMonthTitle, toDateKey } from "../../domain/calendar/dateUtils";

function getMonthCells(anchorDate) {
  const dateKey = toDateKey(anchorDate);
  const [year, month] = dateKey.split("-").map(Number);
  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const firstDay = new Date(`${firstDate}T00:00:00Z`).getUTCDay();
  const leadingDays = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const offset = index - leadingDays;
    const date = addDays(firstDate, offset);
    return { date, day: Number(date.slice(8)), isCurrentMonth: date.slice(5, 7) === String(month).padStart(2, "0") };
  });
}

export default function MonthOverlay({ anchorDate, onSelectDate, onClose }) {
  const dateKey = toDateKey(anchorDate);
  const cells = getMonthCells(dateKey);

  return (
    <Modal title={formatMonthTitle(dateKey)} onClose={onClose} className="month-overlay-modal">
      <div className="month-overlay">
        <header className="month-overlay-header">
          <div>
            <p className="eyebrow">CALENDAR OVERVIEW</p>
            <h2>{formatMonthTitle(dateKey)}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="월간 닫기">×</button>
        </header>
        <div className="month-weekdays" aria-hidden="true">
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="month-grid">
          {cells.map((cell) => (
            <button
              className={cell.isCurrentMonth ? "" : "is-outside"}
              type="button"
              key={cell.date}
              onClick={() => cell.isCurrentMonth && onSelectDate(cell.date)}
              aria-label={`${cell.day}일`}
              disabled={!cell.isCurrentMonth}
            >
              {cell.day}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
