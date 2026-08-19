// 서버가 만든 Markdown을 읽기 전용 문서로 안전하게 렌더링한다.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ markdown = "" }) {
  if (!markdown.trim()) {
    return <p className="empty-document">표시할 문서가 아직 없어요.</p>;
  }

  return (
    <article className="markdown-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
