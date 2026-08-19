// 앱 루트가 비로그인 사용자의 Blocki 인증 진입점을 제공하는지 검증한다.
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
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
});
