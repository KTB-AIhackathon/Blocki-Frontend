export function generationToast(documentType, status, missingSources = []) {
  const label = documentType === "RESUME" ? "이력서" : "포트폴리오";
  if (status !== "PARTIALLY_SUCCEEDED") {
    return `${label}를 생성했어요.`;
  }
  if (Array.isArray(missingSources) && missingSources.length > 0) {
    return "문서를 생성했지만 일부 데이터가 누락됐어요.";
  }
  return `${label}를 만들었어요. 비어 있는 칸은 노션에서 채워 주세요.`;
}
