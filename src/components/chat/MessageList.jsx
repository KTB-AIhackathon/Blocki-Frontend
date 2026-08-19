// 사용자·에이전트 메시지와 현재 생성 상태를 대화 버블로 표시한다.
import GenerationStatus from "./GenerationStatus";

export default function MessageList({ messages, generation, onRetry }) {
  return (
    <div className="message-list" aria-live="polite">
      {messages.map((message) => (
        <div className={`chat-message ${message.role === "USER" ? "is-user" : "is-assistant"}`} key={message.id}>
          <span className="message-role">{message.role === "USER" ? "나" : "Blocki"}</span>
          <p>{message.content}</p>
        </div>
      ))}
      <GenerationStatus generation={generation} onRetry={onRetry} />
    </div>
  );
}
