// 일정 상세 모달의 시간·수행 동작·원문 prompt 표시를 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BlockDetailModal from "./BlockDetailModal";

describe("BlockDetailModal", () => {
  it("renders every related action and closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <BlockDetailModal
        detail={{
          name: "서버 상태 점검",
          startAt: "2026-08-18T09:00:00+09:00",
          endAt: "2026-08-18T09:30:00+09:00",
          prompt: "매일 오전 9시에 EC2 상태를 확인해줘",
          actions: [
            { title: "EC2 상태 조회", description: "대상 인스턴스 확인" },
            { title: "결과 알림", description: "이상이 있으면 메시지 전송" },
          ],
          connectionStatus: "CONNECTED",
          latestRunStatus: "SCHEDULED",
        }}
        relatedItems={[]}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("오전 9:00–오전 9:30")).toBeInTheDocument();
    expect(screen.getByText("EC2 상태 조회")).toBeInTheDocument();
    expect(screen.getByText("매일 오전 9시에 EC2 상태를 확인해줘")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "상세 닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
