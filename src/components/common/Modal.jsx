// 공통 모달의 접근성·Escape·배경 닫기 동작을 제공한다.
import { useEffect } from "react";

export default function Modal({ title, children, onClose, className = "" }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-label={title}
        aria-modal="true"
        className={`modal ${className}`.trim()}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </section>
    </div>
  );
}
