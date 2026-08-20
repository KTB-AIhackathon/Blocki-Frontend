// 앱 루트가 비로그인 사용자의 Blocki 인증 진입점을 제공하는지 검증한다.
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "opener", { configurable: true, value: null });
    window.history.replaceState({}, "", "/");
  });

  it("renders the Blocki entry point", async () => {
    window.history.replaceState({}, "", "/login");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Blocki 로그인" })).toBeInTheDocument();
  });

  it("/signup에서 회원가입 화면을 직접 표시한다", async () => {
    window.history.replaceState({}, "", "/signup");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Blocki 회원가입" })).toBeInTheDocument();
  });

  it("OAuth 콜백 팝업은 부모 창에 결과를 알리고 닫힌다", async () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "opener", { configurable: true, value: { postMessage } });
    const close = vi.spyOn(window, "close").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/oauth/callback?provider=github&result=success");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "GitHub 연결을 확인했어요." })).toBeInTheDocument();
    expect(postMessage).toHaveBeenCalledWith({
      type: "blocki:oauth-complete",
      provider: "GITHUB",
      result: "success",
      error: null,
    }, window.location.origin);
    expect(close).toHaveBeenCalled();
  });

  it("Notion 페이지 접근이 없으면 연결은 유지한 채 다시 선택하라고 말한다", async () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "opener", { configurable: true, value: { postMessage } });
    vi.spyOn(window, "close").mockImplementation(() => undefined);
    window.history.replaceState(
      {},
      "",
      "/oauth/callback?provider=notion&result=success&error=NOTION_PAGE_ACCESS",
    );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Notion은 연결됐어요. 페이지를 다시 선택해 주세요." }))
      .toBeInTheDocument();
    expect(postMessage).toHaveBeenCalledWith({
      type: "blocki:oauth-complete",
      provider: "NOTION",
      result: "success",
      error: "NOTION_PAGE_ACCESS",
    }, window.location.origin);
  });
});
