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

export function generationBothToast(results = []) {
  const missing = results.some((item) => Array.isArray(item.missingSources) && item.missingSources.length > 0);
  const partial = results.some((item) => item.status === "PARTIALLY_SUCCEEDED");
  if (missing) {
    return "문서를 생성했지만 일부 데이터가 누락됐어요.";
  }
  if (partial) {
    return "이력서와 포트폴리오를 만들었어요. 비어 있는 칸은 노션에서 채워 주세요.";
  }
  return "이력서와 포트폴리오를 생성했어요.";
}
