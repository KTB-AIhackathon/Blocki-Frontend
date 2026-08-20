// 생성 상태 polling이 terminal 상태·Retry-After·timeout 경계를 지키는지 검증한다.
import { describe, expect, it, vi } from "vitest";
import { pollGeneration } from "./generationPolling";

describe("pollGeneration", () => {
  it("stops at a terminal status and honors a server retry delay", async () => {
    const getGeneration = vi
      .fn()
      .mockResolvedValueOnce({ id: "generation-1", status: "RUNNING", retryAfter: 2 })
      .mockResolvedValueOnce({ id: "generation-1", status: "SUCCEEDED", assistantMessage: "완료" });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollGeneration("generation-1", { getGeneration, sleep, intervalMs: 1000 }),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    expect(sleep).toHaveBeenCalledWith(2000, expect.anything());
  });

  it("uses_240_seconds_as_the_default_poll_duration", async () => {
    const getGeneration = vi.fn().mockResolvedValue({ id: "generation-1", status: "RUNNING" });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollGeneration("generation-1", { getGeneration, sleep, intervalMs: 60_000 }),
    ).rejects.toMatchObject({ code: "GENERATION_TIMEOUT" });
    expect(sleep).toHaveBeenCalledTimes(4);
  });

  it("throws a safe timeout error after the maximum duration", async () => {
    const getGeneration = vi.fn().mockResolvedValue({ id: "generation-1", status: "RUNNING" });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollGeneration("generation-1", {
        getGeneration,
        sleep,
        intervalMs: 1000,
        maxDurationMs: 2000,
      }),
    ).rejects.toMatchObject({ code: "GENERATION_TIMEOUT", retryable: true });
  });

  it("부분 성공도 백엔드 문서 생성의 terminal 상태로 처리한다", async () => {
    const getGeneration = vi.fn().mockResolvedValue({
      id: "generation-1",
      status: "PARTIALLY_SUCCEEDED",
      missingSources: ["NOTION"],
    });
    const sleep = vi.fn();

    await expect(
      pollGeneration("generation-1", { getGeneration, sleep }),
    ).resolves.toMatchObject({ status: "PARTIALLY_SUCCEEDED" });
    expect(sleep).not.toHaveBeenCalled();
  });
});
