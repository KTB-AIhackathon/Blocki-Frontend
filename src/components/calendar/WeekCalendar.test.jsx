// 주간 캘린더의 주 이동·선택·겹침 요약 상호작용을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WeekCalendar from "./WeekCalendar";

const items = [
  {
    occurrenceId: "occ-1",
    blockId: "block-1",
    workflowId: "workflow-1",
    name: "서버 상태 점검",
    type: "HEALTH_CHECK",
    startAt: "2026-08-18T09:00:00+09:00",
    endAt: "2026-08-18T09:30:00+09:00",
    actionSummary: "EC2 상태 확인",
  },
  {
    occurrenceId: "occ-2",
    blockId: "block-2",
    workflowId: "workflow-1",
    name: "비용 리포트",
    type: "REPORT",
    startAt: "2026-08-18T09:00:00+09:00",
    endAt: "2026-08-18T09:30:00+09:00",
    actionSummary: "AWS 비용 집계",
  },
  {
    occurrenceId: "occ-3",
    blockId: "block-3",
    workflowId: "workflow-1",
    name: "백업 확인",
    type: "BACKUP",
    startAt: "2026-08-18T09:00:00+09:00",
    endAt: "2026-08-18T09:30:00+09:00",
    actionSummary: "DB 백업 확인",
  },
];

describe("WeekCalendar", () => {
  it("moves between weeks and keeps the month overlay action visible", async () => {
    const user = userEvent.setup();
    const onWeekChange = vi.fn();
    const onOpenMonth = vi.fn();

    render(
      <WeekCalendar
        weekStart="2026-08-17"
        items={items}
        selectedOccurrenceId={null}
        onWeekChange={onWeekChange}
        onOpenMonth={onOpenMonth}
        onSelectOccurrence={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "다음 주" }));
    await user.click(screen.getByRole("button", { name: "이전 주" }));
    await user.click(screen.getByRole("button", { name: "월간 캘린더" }));

    expect(onWeekChange).toHaveBeenNthCalledWith(1, "2026-08-24");
    expect(onWeekChange).toHaveBeenNthCalledWith(2, "2026-08-10");
    expect(onOpenMonth).toHaveBeenCalledTimes(1);
  });

  it("selects a block once and opens details on double click", async () => {
    const user = userEvent.setup();
    const onSelectOccurrence = vi.fn();
    const onOpenDetail = vi.fn();

    render(
      <WeekCalendar
        weekStart="2026-08-17"
        items={items}
        selectedOccurrenceId={null}
        onWeekChange={vi.fn()}
        onOpenMonth={vi.fn()}
        onSelectOccurrence={onSelectOccurrence}
        onOpenDetail={onOpenDetail}
      />,
    );

    expect(screen.getByText("작업 외 2개")).toBeInTheDocument();
    const block = screen.getByRole("button", { name: /서버 상태 점검/ });
    await user.click(block);
    await user.dblClick(block);
    onOpenDetail.mockClear();
    await user.click(screen.getByText("작업 외 2개"));

    expect(onSelectOccurrence).toHaveBeenCalledWith("occ-1");
    expect(onOpenDetail).toHaveBeenCalledWith(items);
  });
});
