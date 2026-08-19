// 블록 드래그 데이터와 30분 단위 드롭 시간 계산을 제공한다.
import {
  createZonedDateTime,
  getDurationMinutes,
  snapMinutes,
  toDateKey,
} from "./dateUtils";

export const BLOCK_DRAG_MIME = "application/x-blocki-block";

export function createDragPayload({ occurrenceId, blockId, source }) {
  if (!occurrenceId || !blockId || !["CALENDAR", "STORAGE"].includes(source)) {
    throw new Error("A valid occurrenceId, blockId, and source are required");
  }

  return JSON.stringify({ version: 1, occurrenceId, blockId, source });
}

export function parseDragPayload(value) {
  try {
    const payload = JSON.parse(value);
    if (
      payload?.version !== 1 ||
      typeof payload.occurrenceId !== "string" ||
      typeof payload.blockId !== "string" ||
      !["CALENDAR", "STORAGE"].includes(payload.source)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function calculateDropSchedule({
  dropDate,
  dropMinutes,
  durationMinutes,
  startAt,
  endAt,
  zoneId = "Asia/Seoul",
}) {
  const duration = durationMinutes ?? getDurationMinutes(startAt, endAt);
  const snappedMinutes = snapMinutes(dropMinutes, 30);
  const dateKey = toDateKey(dropDate, zoneId);

  return {
    startAt: createZonedDateTime(dateKey, snappedMinutes, zoneId),
    endAt: createZonedDateTime(dateKey, snappedMinutes + duration, zoneId),
    zoneId,
  };
}
