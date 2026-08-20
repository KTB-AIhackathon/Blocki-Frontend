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

const weekdayKeys = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const weekdayFromShort = {
  Sun: "SUNDAY",
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
};

function kstClockParts(now) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

function clockLabel(hour, minute) {
  const minuteNumber = Number(minute);
  return minuteNumber > 0 ? `${Number(hour)}시 ${minuteNumber}분` : `${Number(hour)}시`;
}

export function describeNextAutomationRun(dayOfWeek, hour, minute, now = new Date(), { draft = false, enabled = true } = {}) {
  const lead = !enabled
    ? (draft
      ? "저장하면 시간만 바뀌어요. 자동화가 꺼져 있어서 바로 돌아가지 않아요. 켜면 다음 실행은"
      : "자동화가 꺼져 있어서 이 시간에는 안 돌아요. 켜면 다음 실행은")
    : (draft ? "저장하면 다음 실행은" : "지금 바로 만들지 않아요. 다음 실행은");
  const parts = kstClockParts(now);
  const nowDay = weekdayFromShort[parts.weekday];
  const targetIndex = weekdayKeys.indexOf(dayOfWeek);
  const nowIndex = weekdayKeys.indexOf(nowDay);
  if (targetIndex < 0 || nowIndex < 0) {
    if (!enabled) {
      return draft
        ? "저장하면 시간만 바뀌어요. 실행하려면 자동화를 켜 주세요."
        : "자동화가 꺼져 있어서 이 시간에는 안 돌아요. 실행하려면 자동화를 켜 주세요.";
    }
    return draft
      ? "저장하면 고른 요일·시간에 한 번 돌아요."
      : "지금 바로 만들지 않아요. 저장한 요일·시간에 한 번 돌아요.";
  }
  const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const targetMinutes = Number(hour) * 60 + Number(minute);
  let daysAhead = (targetIndex - nowIndex + 7) % 7;
  if (daysAhead === 0 && targetMinutes <= nowMinutes) {
    daysAhead = 7;
  }
  const when = daysAhead === 0
    ? `오늘 ${dayLabelsByValue[dayOfWeek]}`
    : daysAhead === 7
      ? `다음 주 ${dayLabelsByValue[dayOfWeek]}`
      : dayLabelsByValue[dayOfWeek];
  const clock = clockLabel(hour, minute);
  const copula = clock.endsWith("분") ? "이에요" : "예요";
  return `${lead} ${when} ${clock}${copula}.`;
}

export default function AutomationScheduleSettings() {
  const {
    automation,
    automationLoaded,
    loadStatus,
    pendingAutomation,
    updateDocumentGenerationAutomation,
    integrations,
  } = useDocumentWorkspace();
  const githubConnected = integrations.some((item) => item.provider === "GITHUB" && item.status === "CONNECTED");
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

  const settingsReady = loadStatus === "READY" && automationLoaded;

  const handleToggle = async () => {
    if (!settingsReady) {
      return;
    }
    if (!automation.enabled && !githubConnected) {
      return;
    }
    await updateDocumentGenerationAutomation(!automation.enabled, {
      dayOfWeek,
      time: `${hour}:${minute}`,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!settingsReady || isSubmittingRef.current) {
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
            disabled={pendingAutomation || !settingsReady || (!automation.enabled && !githubConnected)}
            type="button"
            onClick={handleToggle}
          >
            {pendingAutomation ? "저장 중…" : automation.enabled ? "자동화 끄기" : "자동화 켜기"}
          </button>
        </div>
      </div>
      <p className="settings-section-description">
        문서 자동화가 켜져 있으면, 매주 아래 요일·시간에 이력서와 포트폴리오를 자동으로 생성해요.
        {" "}
        {isDirty
          ? describeNextAutomationRun(dayOfWeek, hour, minute, new Date(), {
            draft: true,
            enabled: automation.enabled,
          })
          : describeNextAutomationRun(
            savedSchedule.dayOfWeek,
            extractHour(savedSchedule.time),
            extractMinute(savedSchedule.time),
            new Date(),
            { enabled: automation.enabled },
          )}
        {loadStatus === "READY" && !automationLoaded
          ? " 설정을 아직 불러오지 못했어요. 새로고침한 뒤 다시 저장해 주세요."
          : ""}
        {!automation.enabled && !githubConnected
          ? " GitHub를 다시 연결해야 자동화를 켤 수 있어요."
          : ""}
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
        <button className="button button-primary" type="submit" disabled={pendingAutomation || !isDirty || !settingsReady}>
          {pendingAutomation ? "저장 중…" : "저장"}
        </button>
      </form>
      <p className="automation-schedule-timezone">시간대는 한국 표준시(Asia/Seoul)로 고정돼요.</p>
      {showSavedModal ? (
        <AutomationSavedModal
          dayLabel={dayLabelsByValue[dayOfWeek] ?? dayOfWeek}
          hour={hour}
          minute={minute}
          enabled={automation.enabled}
          nextRunCopy={describeNextAutomationRun(dayOfWeek, hour, minute, new Date(), {
            enabled: automation.enabled,
          })}
          onClose={() => setShowSavedModal(false)}
        />
      ) : null}
    </section>
  );
}
