// Blocki 화면에서 사용하는 일관된 선형 아이콘을 표시한다.
const iconPaths = {
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  "circle-alert": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  "file-text": (
    <>
      <path d="M6 3.5h9l3 3V21H6z" />
      <path d="M15 3.5V7h3M9 11h6M9 15h4" />
    </>
  ),
  "home": (
    <>
      <path d="m3 10.5 9-7.5 9 7.5" />
      <path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" />
    </>
  ),
  "log-out": (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  "settings": (
    <>
      <path d="m12 3.5 1.4 2.2 2.5.4.8 2.4 2.1 1.4-.8 2.4.8 2.4-2.1 1.4-.8 2.4-2.5.4L12 21l-1.4-2.2-2.5-.4-.8-2.4-2.1-1.4.8-2.4-.8-2.4 2.1-1.4.8-2.4 2.5-.4L12 3.5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        {iconPaths[name]}
      </g>
    </svg>
  );
}
