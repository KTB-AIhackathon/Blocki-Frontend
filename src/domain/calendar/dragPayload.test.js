// 블록 드래그 payload와 30분 단위 일정 이동 계산을 검증한다.
import { describe, expect, it } from "vitest";
import {
  calculateDropSchedule,
  createDragPayload,
  parseDragPayload,
} from "./dragPayload";

describe("drag payload", () => {
  it("serializes only known block identity and source", () => {
    const payload = createDragPayload({ occurrenceId: "occ-1", blockId: "block-1", source: "CALENDAR" });

    expect(parseDragPayload(payload)).toEqual({
      version: 1,
      occurrenceId: "occ-1",
      blockId: "block-1",
      source: "CALENDAR",
    });
    expect(parseDragPayload("not-json")).toBeNull();
  });

  it("snaps the drop and preserves the original duration", () => {
    expect(
      calculateDropSchedule({
        dropDate: "2026-08-20",
        dropMinutes: 10 * 60 + 14,
        startAt: "2026-08-18T09:00:00+09:00",
        endAt: "2026-08-18T10:30:00+09:00",
      }),
    ).toEqual({
      startAt: "2026-08-20T10:00:00+09:00",
      endAt: "2026-08-20T11:30:00+09:00",
      zoneId: "Asia/Seoul",
    });
  });
});
