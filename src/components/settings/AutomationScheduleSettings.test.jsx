// 자동화 시간 설정 폼의 렌더링과 저장 동작을 검증한다.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AutomationScheduleSettings from "./AutomationScheduleSettings";
import { DocumentProvider } from "../../state/DocumentContext";

function createDocumentApiDouble() {
  let automation = {
    enabled: true,
    schedule: { dayOfWeek: "MONDAY", time: "21:00", timezone: "Asia/Seoul" },
  };
  return {
    listIntegrations: vi.fn(async () => ({ integrations: [] })),
    listDocuments: vi.fn(async () => ({ documents: [] })),
    getDocumentVersion: vi.fn(),
    getDocumentGenerationAutomation: vi.fn(async () => automation),
    updateDocumentGenerationAutomation: vi.fn(async (enabled, schedule) => {
      automation = { enabled, schedule: { ...automation.schedule, ...schedule } };
      return automation;
    }),
  };
}

describe("AutomationScheduleSettings", () => {
  it("저장된 요일·시간을 폼에 채워서 보여주고, 바꾸기 전엔 저장 버튼이 비활성화된다", async () => {
    const api = createDocumentApiDouble();
    render(
      <DocumentProvider api={api}>
        <AutomationScheduleSettings />
      </DocumentProvider>,
    );

    expect(await screen.findByRole("heading", { name: "자동화 시간 설정하기" })).toBeInTheDocument();
    expect(screen.getByLabelText("요일")).toHaveValue("MONDAY");
    expect(screen.getByLabelText("시간")).toHaveValue("21");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("요일·시간을 바꾸고 저장하면 enabled는 유지한 채 schedule만 함께 전송하고, 저장 완료 모달을 보여준다", async () => {
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

    const saveButton = screen.getByRole("button", { name: "저장" });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    expect(api.updateDocumentGenerationAutomation).toHaveBeenCalledWith(true, {
      dayOfWeek: "WEDNESDAY",
      time: "09:00",
    });

    const savedModal = await screen.findByRole("dialog", { name: "자동화 시간 저장 완료" });
    expect(savedModal).toHaveTextContent("저장했어요");
    expect(savedModal).toHaveTextContent("매주 수요일 9시");

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("dialog", { name: "자동화 시간 저장 완료" })).not.toBeInTheDocument();
  });
});
