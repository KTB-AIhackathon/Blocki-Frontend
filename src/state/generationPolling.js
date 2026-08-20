// 생성 상태를 일정 간격으로 조회하고 terminal 결과에서 안전하게 멈춘다.
const TERMINAL_STATUSES = new Set(["SUCCEEDED", "PARTIALLY_SUCCEEDED", "NEEDS_INPUT", "UNSUPPORTED", "FAILED"]);

function createTimeoutError() {
  return Object.assign(new Error("생성 시간이 초과되었습니다. 다시 시도해주세요."), {
    code: "GENERATION_TIMEOUT",
    retryable: true,
  });
}

function sleepFor(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function getRetryDelay(result, intervalMs) {
  if (Number.isFinite(result?.retryAfterMs)) {
    return result.retryAfterMs;
  }
  if (Number.isFinite(Number(result?.retryAfter))) {
    return Number(result.retryAfter) * 1000;
  }
  return intervalMs;
}

export async function pollGeneration(
  generationId,
  {
    getGeneration,
    signal,
    sleep = sleepFor,
    intervalMs = 1000,
    maxDurationMs = 60000,
  },
) {
  const activeSignal = signal ?? new AbortController().signal;
  let elapsedMs = 0;

  while (elapsedMs < maxDurationMs) {
    if (activeSignal.aborted) {
      throw activeSignal.reason ?? new DOMException("Aborted", "AbortError");
    }
    const result = await getGeneration(generationId, { signal: activeSignal });
    if (TERMINAL_STATUSES.has(result?.status)) {
      return result;
    }
    const delayMs = Math.min(getRetryDelay(result, intervalMs), maxDurationMs - elapsedMs);
    await sleep(delayMs, activeSignal);
    elapsedMs += delayMs;
  }

  throw createTimeoutError();
}
