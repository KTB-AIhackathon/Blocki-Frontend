// C 방식 중앙 월간 overlay의 날짜 선택과 닫기를 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MonthOverlay from "./MonthOverlay";

describe("MonthOverlay", () => {
  it("selects a date and closes from the overlay", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    const onClose = vi.fn();
    render(<MonthOverlay anchorDate="2026-08-19" onSelectDate={onSelectDate} onClose={onClose} />);

    expect(screen.getByRole("heading", { name: "2026년 8월" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "18일" }));
    await user.click(screen.getByRole("button", { name: "월간 닫기" }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-08-18");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
