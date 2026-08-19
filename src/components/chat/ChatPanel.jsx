// 선택 세션의 메시지·생성 상태·자동화 요청 입력을 표시하는 AI 채팅 패널이다.
import ChatComposer from "./ChatComposer";
import MessageList from "./MessageList";
import { useWorkspace } from "../../state/WorkspaceContext";

export default function ChatPanel() {
  const {
    sessions,
    selectedSessionId,
    chatMessages,
    generation,
    sendMessage,
    retryGeneration,
  } = useWorkspace();
  const session = sessions.find((candidate) => candidate.id === selectedSessionId);
  const busy = ["QUEUED", "RUNNING"].includes(generation?.status);

  return (
    <aside className="chat-panel" aria-label="AI 채팅" role="region">
      <header className="chat-header">
        <span className="chat-bot-mark" aria-hidden="true">✦</span>
        <div>
          <strong>{session?.title ?? "새 자동화"}</strong>
          <span>AI 자동화 에이전트</span>
        </div>
      </header>
      <MessageList messages={chatMessages} generation={generation} onRetry={retryGeneration} />
      <ChatComposer onSend={sendMessage} disabled={busy} />
    </aside>
  );
}
