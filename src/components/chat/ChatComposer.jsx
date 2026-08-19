// 채팅 메시지 입력과 전송 버튼을 제공한다.
import { useState } from "react";

export default function ChatComposer({ onSend, disabled = false }) {
  const [content, setContent] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || !content.trim()) {
      return;
    }
    const sent = await onSend(content);
    if (sent !== false) {
      setContent("");
    }
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <textarea
        aria-label="자동화 요청"
        placeholder="자동화를 요청해보세요…"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={disabled}
        rows={2}
      />
      <button type="submit" aria-label="보내기" disabled={disabled || !content.trim()}>
        ↑
      </button>
    </form>
  );
}
