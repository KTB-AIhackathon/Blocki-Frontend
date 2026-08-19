// 우측 하단 알림이 일정 시간이 지나면 자동으로 닫히는지 검증한다.
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Toast from "./Toast";

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("알림을 보여준 뒤 자동으로 닫는다", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="GitHub을 연결했어요." onClose={onClose} />);

    expect(screen.getByRole("status")).toHaveTextContent("GitHub을 연결했어요.");

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
