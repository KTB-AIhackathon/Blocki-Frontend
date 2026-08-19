// 달력 일정들을 같은 표시 시간대별 대표 카드 그룹으로 묶는다.
import { getMinutesFromMidnight, toDateKey } from "./dateUtils";

function getDisplayRangeKey(item) {
  return [
    toDateKey(item.startAt),
    getMinutesFromMidnight(item.startAt),
    toDateKey(item.endAt),
    getMinutesFromMidnight(item.endAt),
  ].join("|");
}

export function groupCalendarItems(items = []) {
  const groups = new Map();

  for (const item of items) {
    const key = getDisplayRangeKey(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }

  return [...groups.values()]
    .map((groupItems) => ({
      startAt: groupItems[0].startAt,
      endAt: groupItems[0].endAt,
      items: groupItems,
      visibleItem: groupItems[0],
      hiddenCount: Math.max(0, groupItems.length - 1),
    }))
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
}
