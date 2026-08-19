// 달력 날짜 계산의 주간 경계와 시간 슬롯을 검증한다.
import { describe, expect, it } from "vitest";
import {
  addWeeks,
  getMondayWeekStart,
  getWeekDates,
  snapMinutes,
} from "./dateUtils";

describe("calendar date utilities", () => {
  it("normalizes Sunday to the previous Monday", () => {
    expect(getMondayWeekStart("2026-08-23")).toBe("2026-08-17");
  });

  it("moves across month boundaries by week", () => {
    expect(addWeeks("2026-08-31", 1)).toBe("2026-09-07");
    expect(addWeeks("2026-09-07", -1)).toBe("2026-08-31");
  });

  it("returns seven dates from Monday through Sunday", () => {
    expect(getWeekDates("2026-08-17")).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });

  it("snaps minutes to the nearest 30 minute slot", () => {
    expect(snapMinutes(8 * 60 + 14)).toBe(8 * 60);
    expect(snapMinutes(8 * 60 + 16)).toBe(8 * 60 + 30);
  });
});
