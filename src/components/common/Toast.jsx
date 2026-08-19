// 사용자에게 일시적인 성공·오류 안내를 표시한다.
import { useEffect, useState } from "react";

const EXIT_START_MS = 3200;
const CLOSE_MS = 3500;

export default function Toast({ message, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!message || !onClose) {
      return undefined;
    }

    setIsClosing(false);
    const exitTimer = globalThis.setTimeout(() => setIsClosing(true), EXIT_START_MS);
    const closeTimer = globalThis.setTimeout(onClose, CLOSE_MS);
    return () => {
      globalThis.clearTimeout(exitTimer);
      globalThis.clearTimeout(closeTimer);
    };
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`toast ${isClosing ? "is-closing" : ""}`} role="status">
      <span>{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="안내 닫기">
          ×
        </button>
      ) : null}
    </div>
  );
}
