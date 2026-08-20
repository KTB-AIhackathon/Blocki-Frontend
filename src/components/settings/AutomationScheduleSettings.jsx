// 문서 자동화가 매주 실행될 요일·시·분을 사용자가 직접 설정한다.
import { useEffect, useRef, useState } from "react";
import { useDocumentWorkspace } from "../../state/DocumentContext";
import AutomationSavedModal from "./AutomationSavedModal";

const dayOptions = [
  { value: "MONDAY", label: "월요일" },
  { value: "TUESDAY", label: "화요일" },
  { value: "WEDNESDAY", label: "수요일" },
  { value: "THURSDAY", label: "목요일" },
  { value: "FRIDAY", label: "금요일" },
  { value: "SATURDAY", label: "토요일" },
  { value: "SUNDAY", label: "일요일" },
];

const dayLabelsByValue = dayOptions.reduce((labels, day) => {
  labels[day.value] = day.label;
  return labels;
}, {});

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minuteOptions = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

function extractPart(time = "21:00", index, fallback) {
  const value = String(time).split(":")[index];
  return value ? value.padStart(2, "0") : fallback;
}

function extractHour(time = "21:00") {
  return extractPart(time, 0, "21");
}

function extractMinute(time = "21:00") {
  return extractPart(time, 1, "00");
}

export default function AutomationScheduleSettings() {
  const { automation, pendingAutomation, updateDocumentGenerationAutomation } = useDocumentWorkspace();
  const savedSchedule = automation.schedule;
  const [dayOfWeek, setDayOfWeek] = useState(savedSchedule.dayOfWeek);
  const [hour, setHour] = useState(extractHour(savedSchedule.time));
  const [minute, setMinute] = useState(extractMinute(savedSchedule.time));
  const [showSavedModal, setShowSavedModal] = useState(false);
  // 저장 버튼이 짧은 시간에 두 번 눌리거나 제출 이벤트가 겹쳐도 PUT이 한 번만 나가도록 동기적으로 잠근다.
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setDayOfWeek(savedSchedule.dayOfWeek);
    setHour(extractHour(savedSchedule.time));
    setMinute(extractMinute(savedSchedule.time));
  }, [savedSchedule.dayOfWeek, savedSchedule.time]);

  const isDirty = dayOfWeek !== savedSchedule.dayOfWeek
    || hour !== extractHour(savedSchedule.time)
    || minute !== extractMinute(savedSchedule.time);

  const handleToggle = async () => {
    await updateDocumentGenerationAutomation(!automation.enabled, {
      dayOfWeek,
      time: `${hour}:${minute}`,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    // 요청 시점의 요일·시·분을 스냅샷으로 고정해, 응답을 기다리는 동안 다른 값으로 다시 제출돼도
    // 이번 요청은 항상 사용자가 방금 누른 그 값으로만 나가게 한다.
    const submittedDayOfWeek = dayOfWeek;
    const submittedTime = `${hour}:${minute}`;
    try {
      const result = await updateDocumentGenerationAutomation(automation.enabled, {
        dayOfWeek: submittedDayOfWeek,
        time: submittedTime,
      });
      if (result) {
        setShowSavedModal(true);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <section className="settings-section" aria-labelledby="automation-schedule-heading">
      <div className="settings-section-heading automation-schedule-heading">
        <div>
          <p className="section-kicker">AUTOMATION</p>
          <h2 id="automation-schedule-heading">자동화 시간 설정하기</h2>
        </div>
        <div className="automation-schedule-status">
          <span className={automation.enabled ? "is-on" : ""}>
            {automation.enabled ? "현재 켜짐" : "현재 꺼짐"}
          </span>
          <button
            className="button button-outline compact-button"
            disabled={pendingAutomation}
            type="button"
            onClick={handleToggle}
          >
            {pendingAutomation ? "저장 중…" : automation.enabled ? "자동화 끄기" : "자동화 켜기"}
          </button>
        </div>
      </div>
      <p className="settings-section-description">
        문서 자동화가 켜져 있으면, 매주 아래 요일·시간에 이력서와 포트폴리오를 자동으로 생성해요.
      </p>
      <form className="automation-schedule-form" onSubmit={handleSubmit}>
        <div className="automation-schedule-field">
          <label htmlFor="automation-schedule-day">요일</label>
          <select
            id="automation-schedule-day"
            value={dayOfWeek}
            onChange={(event) => setDayOfWeek(event.target.value)}
          >
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
        <div className="automation-schedule-field">
          <label htmlFor="automation-schedule-hour">시간</label>
          <select
            id="automation-schedule-hour"
            className="automation-hour-select"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
          >
            {hourOptions.map((value) => (
              <option key={value} value={value}>
                {Number(value)}시
              </option>
            ))}
          </select>
        </div>
        <div className="automation-schedule-field">
          <label htmlFor="automation-schedule-minute">분</label>
          <select
            id="automation-schedule-minute"
            className="automation-minute-select"
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
          >
            {minuteOptions.map((value) => (
              <option key={value} value={value}>
                {Number(value)}분
              </option>
            ))}
          </select>
        </div>
        <button className="button button-primary" type="submit" disabled={pendingAutomation || !isDirty}>
          {pendingAutomation ? "저장 중…" : "저장"}
        </button>
      </form>
      <p className="automation-schedule-timezone">시간대는 한국 표준시(Asia/Seoul)로 고정돼요.</p>
      {showSavedModal ? (
        <AutomationSavedModal
          dayLabel={dayLabelsByValue[dayOfWeek] ?? dayOfWeek}
          hour={hour}
          minute={minute}
          onClose={() => setShowSavedModal(false)}
        />
      ) : null}
    </section>
  );
}
