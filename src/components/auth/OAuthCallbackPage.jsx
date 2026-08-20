// OAuth 팝업의 성공·실패 결과를 부모 창에 전달하고 안전하게 닫는다.
import { useEffect, useRef } from "react";

const providerLabels = { GITHUB: "GitHub", NOTION: "Notion" };

export default function OAuthCallbackPage() {
  const reported = useRef(false);
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider")?.toUpperCase();
  const result = params.get("result") === "success" ? "success" : "failed";
  const error = params.get("error");
  const label = providerLabels[provider] ?? "서비스";

  useEffect(() => {
    if (reported.current) {
      return;
    }
    reported.current = true;
    if (window.opener) {
      window.opener.postMessage({
        type: "blocki:oauth-complete",
        provider,
        result,
        error,
      }, window.location.origin);
      window.close();
    }
  }, [error, provider, result]);

  return (
    <main className="oauth-callback-page">
      <section className="oauth-callback-card" aria-live="polite">
        <span className={`oauth-callback-mark ${result === "success" ? "is-success" : "is-failed"}`} aria-hidden="true">
          {result === "success" ? "✓" : "!"}
        </span>
        <h1>{result === "success" ? `${label} 연결을 확인했어요.` : `${label} 연결을 완료하지 못했어요.`}</h1>
        <p>{result === "success" ? "이 창은 자동으로 닫힙니다." : "창을 닫고 다시 시도해주세요."}</p>
      </section>
    </main>
  );
}
