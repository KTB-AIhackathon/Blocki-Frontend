import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentProvider, useDocumentWorkspace } from "./DocumentContext";

vi.mock("./generationPolling", () => ({
  pollGeneration: vi.fn(),
}));

import { pollGeneration } from "./generationPolling";

function Probe() {
  const { generateDocument, toast, documents } = useDocumentWorkspace();
  return (
    <div>
      <button type="button" onClick={() => generateDocument("PORTFOLIO")}>생성</button>
      <p>{toast ?? ""}</p>
      <p>docs:{documents.length}</p>
    </div>
  );
}

function createApi() {
  return {
    listIntegrations: vi.fn().mockResolvedValue({ integrations: [] }),
    listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
    getDocumentGenerationAutomation: vi.fn().mockResolvedValue({
      enabled: true,
      schedule: { dayOfWeek: "FRIDAY", time: "01:44", timezone: "Asia/Seoul" },
    }),
    generateDocument: vi.fn().mockResolvedValue({ id: "job-1" }),
    getDocumentGeneration: vi.fn(),
  };
}

describe("DocumentContext generation timeout", () => {
  beforeEach(() => {
    vi.mocked(pollGeneration).mockReset();
  });

  it("timeout_performs_one_final_job_read_and_reloads_documents", async () => {
    const api = createApi();
    api.getDocumentGeneration.mockResolvedValue({ status: "RUNNING" });
    vi.mocked(pollGeneration).mockRejectedValueOnce(
      Object.assign(new Error("생성 시간이 초과되었습니다. 다시 시도해주세요."), { code: "GENERATION_TIMEOUT" }),
    );

    render(
      <DocumentProvider api={api}>
        <Probe />
      </DocumentProvider>,
    );
    await screen.findByText("docs:0");
    api.listDocuments.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "생성" }));

    await waitFor(() => expect(api.getDocumentGeneration).toHaveBeenCalledWith("job-1"));
    await waitFor(() => expect(api.listDocuments).toHaveBeenCalled());
  });

  it("late_success_after_timeout_shows_the_success_toast", async () => {
    const api = createApi();
    api.getDocumentGeneration.mockResolvedValue({ status: "SUCCEEDED" });
    vi.mocked(pollGeneration).mockRejectedValueOnce(
      Object.assign(new Error("timeout"), { code: "GENERATION_TIMEOUT" }),
    );

    render(
      <DocumentProvider api={api}>
        <Probe />
      </DocumentProvider>,
    );
    await screen.findByText("docs:0");
    await userEvent.click(screen.getByRole("button", { name: "생성" }));

    expect(await screen.findByText("포트폴리오를 생성했어요.")).toBeInTheDocument();
  });

  it("running_after_timeout_shows_background_progress_not_failure", async () => {
    const api = createApi();
    api.getDocumentGeneration.mockResolvedValue({ status: "RUNNING" });
    vi.mocked(pollGeneration).mockRejectedValueOnce(
      Object.assign(new Error("timeout"), { code: "GENERATION_TIMEOUT" }),
    );

    render(
      <DocumentProvider api={api}>
        <Probe />
      </DocumentProvider>,
    );
    await screen.findByText("docs:0");
    await userEvent.click(screen.getByRole("button", { name: "생성" }));

    expect(await screen.findByText("문서 생성이 아직 진행 중이에요. 잠시 후 목록을 확인해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText("생성 시간이 초과되었습니다. 다시 시도해주세요.")).not.toBeInTheDocument();
  });

  it("visible_tab_transition_reloads_automatic_documents_once", async () => {
    const api = createApi();
    render(
      <DocumentProvider api={api}>
        <Probe />
      </DocumentProvider>,
    );
    await waitFor(() => expect(api.listDocuments).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    await waitFor(() => expect(api.listDocuments).toHaveBeenCalledTimes(2));
  });
});
