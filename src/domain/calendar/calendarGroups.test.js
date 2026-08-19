// 같은 시간대에 겹친 일정의 표시 그룹을 검증한다.
import { describe, expect, it } from "vitest";
import { groupCalendarItems } from "./calendarGroups";

const baseItem = {
  occurrenceId: "occ-1",
  blockId: "block-1",
  name: "서버 상태 점검",
  type: "EMAIL",
  startAt: "2026-08-18T09:00:00+09:00",
  endAt: "2026-08-18T09:30:00+09:00",
};

describe("calendar item groups", () => {
  it("keeps a single item visible with no hidden count", () => {
    const [group] = groupCalendarItems([baseItem]);

    expect(group.visibleItem).toEqual(baseItem);
    expect(group.items).toHaveLength(1);
    expect(group.hiddenCount).toBe(0);
  });

  it("summarizes two additional items with the same display range", () => {
    const [group] = groupCalendarItems([
      baseItem,
      { ...baseItem, occurrenceId: "occ-2", blockId: "block-2", name: "비용 리포트" },
      { ...baseItem, occurrenceId: "occ-3", blockId: "block-3", name: "백업 확인" },
    ]);

    expect(group.items).toHaveLength(3);
    expect(group.hiddenCount).toBe(2);
  });
});
