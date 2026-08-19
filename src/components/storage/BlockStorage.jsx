// 일정 블록을 보관하거나 달력으로 되돌릴 수 있는 보관함 목록을 표시한다.
import { formatTime } from "../../domain/calendar/dateUtils";
import { BLOCK_DRAG_MIME, createDragPayload, parseDragPayload } from "../../domain/calendar/dragPayload";
import { useWorkspace } from "../../state/WorkspaceContext";

export default function BlockStorage() {
  const { storedBlocks, calendarItems, moveBlockToStorage } = useWorkspace();

  const handleDrop = (event) => {
    event.preventDefault();
    const rawPayload =
      event.dataTransfer?.getData(BLOCK_DRAG_MIME) ?? event.dataTransfer?.getData("text/plain");
    const payload = parseDragPayload(rawPayload);
    if (payload?.source !== "CALENDAR") {
      return;
    }
    const item = calendarItems.find((candidate) => candidate.blockId === payload.blockId);
    if (item) {
      moveBlockToStorage(item);
    }
  };

  return (
    <section className="storage-view" aria-labelledby="storage-title">
      <div className="workspace-title-row">
        <div>
          <p className="eyebrow">BLOCK STORAGE</p>
          <h1 id="storage-title">보관된 블록</h1>
          <p>필요할 때 달력의 다른 시간대로 다시 꺼낼 수 있어요.</p>
        </div>
        <span className="count-pill">{storedBlocks.length}개</span>
      </div>
      <div
        className="storage-list"
        aria-label="보관된 일정 블록"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {storedBlocks.length === 0 ? <p className="empty-state">보관된 블록이 없어요.</p> : null}
        {storedBlocks.map((block) => (
          <article
            className="storage-card"
            key={block.blockId}
            draggable
            onDragStart={(event) => {
              const payload = createDragPayload({
                occurrenceId: block.occurrenceId,
                blockId: block.blockId,
                source: "STORAGE",
              });
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(BLOCK_DRAG_MIME, payload);
              event.dataTransfer.setData("text/plain", payload);
            }}
          >
            <span className="drag-handle" aria-hidden="true">⠿</span>
            <div>
              <strong>{block.name}</strong>
              <p>{block.actionSummary}</p>
              <small>{block.startAt ? `마지막 일정 ${formatTime(block.startAt)}` : "일정 미지정"}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
