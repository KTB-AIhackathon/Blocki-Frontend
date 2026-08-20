// GitHub와 Notion 연동 항목을 구분하는 단색 브랜드 유사 SVG 로고를 표시한다.
function GitHubLogo() {
  return (
    <svg
      aria-hidden="true"
      className="provider-logo"
      data-provider-logo="GITHUB"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 21v-3.4a4.3 4.3 0 0 0-.9-3.1c3-.34 6.1-1.48 6.1-6.58a5.13 5.13 0 0 0-1.36-3.56 4.8 4.8 0 0 0-.13-3.52S17.64.49 15 2.2a12.1 12.1 0 0 0-6 0C6.36.49 5.29.84 5.29.84a4.8 4.8 0 0 0-.13 3.52A5.13 5.13 0 0 0 3.8 7.92c0 5.1 3.1 6.24 6.1 6.58a4.3 4.3 0 0 0-.9 3.1V21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M9 18.2c-3.9 1.75-4.45-1.65-6.2-1.65"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg
      aria-hidden="true"
      className="provider-logo"
      data-provider-logo="NOTION"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m5.25 5.1 12.3-1.2 1.2 1.35v13.5L6.45 20.1l-1.2-1.35V5.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M8.1 16.8V7.35h2.15l5.65 8.9v-9.5M8.1 7.35l7.8-.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export default function ProviderLogo({ provider }) {
  if (provider === "GITHUB") {
    return <GitHubLogo />;
  }
  if (provider === "NOTION") {
    return <NotionLogo />;
  }
  return <span className="provider-logo-fallback">—</span>;
}
