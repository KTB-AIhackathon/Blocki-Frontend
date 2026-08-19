// 주간 달력과 시간 슬롯에 필요한 순수 날짜 계산을 제공한다.
export const DEFAULT_TIME_ZONE = "Asia/Seoul";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKeyToUtcDate(dateKey) {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function getTimeZoneParts(dateLike, timeZone) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${dateLike}`);
  }

  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

export function toDateKey(dateLike, timeZone = DEFAULT_TIME_ZONE) {
  if (typeof dateLike === "string" && DATE_KEY_PATTERN.test(dateLike)) {
    return dateLike.slice(0, 10);
  }

  const parts = getTimeZoneParts(dateLike, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getMondayWeekStart(dateLike, timeZone = DEFAULT_TIME_ZONE) {
  const date = dateKeyToUtcDate(toDateKey(dateLike, timeZone));
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + daysFromMonday);
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey, amount) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function addWeeks(weekStart, amount) {
  return addDays(getMondayWeekStart(weekStart), amount * 7);
}

export function getWeekDates(weekStart) {
  const monday = getMondayWeekStart(weekStart);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function snapMinutes(minutes, step = 30) {
  if (!Number.isFinite(minutes) || !Number.isFinite(step) || step <= 0) {
    throw new Error("minutes and step must be finite, positive numbers");
  }

  return Math.round(minutes / step) * step;
}

export function getMinutesFromMidnight(dateTime, timeZone = DEFAULT_TIME_ZONE) {
  const parts = getTimeZoneParts(dateTime, timeZone);
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  return hour * 60 + Number(parts.minute);
}

export function getDurationMinutes(startAt, endAt) {
  return Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000));
}

export function createZonedDateTime(dateKey, minutes, timeZone = DEFAULT_TIME_ZONE) {
  const dayOffset = Math.floor(minutes / (24 * 60));
  const normalizedMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const normalizedDateKey = addDays(dateKey, dayOffset);
  const hour = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;
  const offset = timeZone === "Asia/Seoul" ? "+09:00" : "Z";
  return `${normalizedDateKey}T${pad(hour)}:${pad(minute)}:00${offset}`;
}

export function formatTime(dateTime, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateTime));
}

export function formatMonthDay(dateKey) {
  const date = dateKeyToUtcDate(dateKey);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
}

export function formatMonthTitle(dateKey) {
  const date = dateKeyToUtcDate(dateKey);
  return `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월`;
}
