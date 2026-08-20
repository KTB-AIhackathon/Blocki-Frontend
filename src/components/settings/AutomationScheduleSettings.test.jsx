// 자동화 시간 설정 폼의 렌더링과 저장 동작을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AutomationScheduleSettings, { describeNextAutomationRun } from "./AutomationScheduleSettings";
import { DocumentProvider } from "../../state/DocumentContext";

function createDocumentApiDouble({ githubConnected = false } = {}) {
  const integrations = githubConnected
    ? [{ provider: "GITHUB", status: "CONNECTED", itemCount: 1 }]
    : [];
  let automation = {
    enabled: true,
    schedule: { dayOfWeek: "MONDAY", time: "21:00", timezone: "Asia/Seoul" },
  };
  return {
    listIntegrations: vi.fn(async () => ({ integrations })),
    listDocuments: vi.fn(async () => ({ documents: [] })),
    getDocumentGenerationAutomation: vi.fn(async () => automation),
    updateDocumentGenerationAutomation: vi.fn(async (enabled, schedule) => {
      automation = { enabled, schedule: { ...automation.schedule, ...schedule } };
      return automation;
    }),
  };
}

describe("AutomationScheduleSettings", () => {
  it("저장된 요일·시·분을 폼에 채워서 보여주고, 바꾸기 전엔 저장 버튼이 비활성화된다", async () => {
    const api = createDocumentApiDouble();
    render(
      <DocumentProvider api={api}>
        <AutomationScheduleSettings />
      </DocumentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "자동화 시간 설정하기" })).toBeInTheDocument();
    expect(screen.getByText("현재 켜짐")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자동화 끄기" })).toBeEnabled();
    expect(screen.getByLabelText("요일")).toHaveValue("MONDAY");
    expect(screen.getByLabelText("시간")).toHaveValue("21");
    expect(screen.getByLabelText("분")).toHaveValue("00");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("요일·시·분을 바꾸고 저장하면 enabled는 유지한 채 schedule만 함께 전송하고, 저장 완료 모달을 보여준다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    render(
      <DocumentProvider api={api}>
        <AutomationScheduleSettings />
      </DocumentProvider>,
    );

    await screen.findByRole("heading", { name: "자동화 시간 설정하기" });
    await user.selectOptions(screen.getByLabelText("요일"), "WEDNESDAY");
    await user.selectOptions(screen.getByLabelText("시간"), "09");
    await user.selectOptions(screen.getByLabelText("분"), "20");

    const saveButton = screen.getByRole("button", { name: "저장" });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    expect(api.updateDocumentGenerationAutomation).toHaveBeenCalledWith(true, {
      dayOfWeek: "WEDNESDAY",
      time: "09:20",
    });

    const savedModal = await screen.findByRole("dialog", { name: "자동화 시간 저장 완료" });
    expect(savedModal).toHaveTextContent("저장했어요");
    expect(savedModal).toHaveTextContent("매주 수요일 9시 20분");

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("dialog", { name: "자동화 시간 저장 완료" })).not.toBeInTheDocument();
  });

  it("자동화 끄기를 누르면 시간은 유지한 채 enabled만 끈다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble();
    render(
      <DocumentProvider api={api}>
        <AutomationScheduleSettings />
      </DocumentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "자동화 끄기" }));

    expect(api.updateDocumentGenerationAutomation).toHaveBeenCalledWith(false, {
      dayOfWeek: "MONDAY",
      time: "21:00",
    });
    expect(await screen.findByText("현재 꺼짐")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자동화 켜기" })).toBeDisabled();
    expect(screen.getByText(/GitHub를 다시 연결해야 자동화를 켤 수 있어요/)).toBeInTheDocument();
  });

  it("GitHub가 연결되어 있으면 꺼진 자동화를 다시 켤 수 있다", async () => {
    const user = userEvent.setup();
    const api = createDocumentApiDouble({ githubConnected: true });
    api.getDocumentGenerationAutomation = vi.fn(async () => ({
      enabled: false,
      schedule: { dayOfWeek: "FRIDAY", time: "03:09", timezone: "Asia/Seoul" },
    }));
    render(
      <DocumentProvider api={api}>
        <AutomationScheduleSettings />
      </DocumentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "자동화 켜기" }));
    expect(api.updateDocumentGenerationAutomation).toHaveBeenCalledWith(true, {
      dayOfWeek: "FRIDAY",
      time: "03:09",
    });
  });

  it("지난 시각은 다음 주, 아직 안 온 시각은 오늘이라고 말한다", () => {
    const afterSlot = new Date("2026-08-20T17:12:00Z");
    const beforeSlot = new Date("2026-08-20T16:40:00Z");

    expect(describeNextAutomationRun("FRIDAY", "01", "44", afterSlot))
      .toBe("지금 바로 만들지 않아요. 다음 실행은 다음 주 금요일 1시 44분이에요.");
    expect(describeNextAutomationRun("FRIDAY", "01", "44", beforeSlot))
      .toBe("지금 바로 만들지 않아요. 다음 실행은 오늘 금요일 1시 44분이에요.");
    expect(describeNextAutomationRun("MONDAY", "21", "00", afterSlot))
      .toBe("지금 바로 만들지 않아요. 다음 실행은 월요일 21시예요.");
    expect(describeNextAutomationRun("FRIDAY", "01", "44", afterSlot, { draft: true }))
      .toBe("저장하면 다음 실행은 다음 주 금요일 1시 44분이에요.");
    expect(describeNextAutomationRun("FRIDAY", "02", "40", afterSlot, { enabled: false }))
      .toBe("자동화가 꺼져 있어서 이 시간에는 안 돌아요. 켜면 다음 실행은 오늘 금요일 2시 40분이에요.");
    expect(describeNextAutomationRun("FRIDAY", "02", "40", afterSlot, { draft: true, enabled: false }))
      .toBe("저장하면 시간만 바뀌어요. 자동화가 꺼져 있어서 바로 돌아가지 않아요. 켜면 다음 실행은 오늘 금요일 2시 40분이에요.");
  });
});
