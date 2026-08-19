// 로그인 전 데모 워크스페이스에서 사용하는 API 응답 fixture를 정의한다.
const zoneId = "Asia/Seoul";

export const DEMO_WEEK_START = "2026-08-17";

export const demoUser = {
  id: "user-demo",
  email: "demo@blocki.local",
  name: "민서",
};

export const demoSessions = [
  {
    id: "session-1",
    title: "서버 운영 자동화",
    preview: "매일 오전 9시에 EC2 상태를 확인해줘",
    updatedAt: "2026-08-19T14:08:00+09:00",
    messageCount: 4,
    generationStatus: "SUCCEEDED",
  },
  {
    id: "session-2",
    title: "주간 비용 리포트",
    preview: "매주 월요일 AWS 비용 리포트를 만들어줘",
    updatedAt: "2026-08-18T11:20:00+09:00",
    messageCount: 2,
    generationStatus: "SUCCEEDED",
  },
  {
    id: "session-3",
    title: "배포 체크리스트",
    preview: "배포 전 확인할 작업을 정리해줘",
    updatedAt: "2026-08-15T17:05:00+09:00",
    messageCount: 2,
    generationStatus: "SUCCEEDED",
  },
];

export const demoMessages = {
  "session-1": [
    {
      id: "message-1",
      role: "USER",
      content: "매일 오전 9시에 EC2 상태를 확인하고 이상이 있으면 알려줘",
      createdAt: "2026-08-19T14:02:00+09:00",
    },
    {
      id: "message-2",
      role: "ASSISTANT",
      content: "자동화 업무를 생성했어요. 매일 오전 9시에 EC2와 RDS 상태를 확인합니다.",
      createdAt: "2026-08-19T14:03:00+09:00",
      generationStatus: "SUCCEEDED",
    },
    {
      id: "message-3",
      role: "USER",
      content: "매주 월요일 아침에 AWS 비용 리포트도 만들어줘",
      createdAt: "2026-08-19T14:07:00+09:00",
    },
    {
      id: "message-4",
      role: "ASSISTANT",
      content: "비용 리포트 작업을 월요일 오전 10시에 캘린더에 추가했어요.",
      createdAt: "2026-08-19T14:08:00+09:00",
      generationStatus: "SUCCEEDED",
    },
  ],
  "session-2": [
    {
      id: "message-5",
      role: "USER",
      content: "매주 월요일 AWS 비용 리포트를 만들어줘",
      createdAt: "2026-08-18T11:18:00+09:00",
    },
    {
      id: "message-6",
      role: "ASSISTANT",
      content: "월요일 오전 10시에 비용 리포트를 만들도록 준비했어요.",
      createdAt: "2026-08-18T11:20:00+09:00",
      generationStatus: "SUCCEEDED",
    },
  ],
  "session-3": [
    {
      id: "message-7",
      role: "USER",
      content: "배포 전 확인할 작업을 정리해줘",
      createdAt: "2026-08-15T17:04:00+09:00",
    },
    {
      id: "message-8",
      role: "ASSISTANT",
      content: "배포 전 점검 작업을 금요일 오후 4시에 추가했어요.",
      createdAt: "2026-08-15T17:05:00+09:00",
      generationStatus: "SUCCEEDED",
    },
  ],
};

function item({ occurrenceId, blockId, name, type, startAt, endAt, prompt, actionSummary }) {
  return {
    occurrenceId,
    blockId,
    name,
    type,
    startAt,
    endAt,
    zoneId,
    overlapCount: 1,
    connectionStatus: "CONNECTED",
    latestRunStatus: "SCHEDULED",
    prompt,
    actionSummary,
    source: "CALENDAR",
  };
}

export const demoWorkflows = {
  "session-1": {
    id: "workflow-1",
    sessionId: "session-1",
    title: "서버 운영 자동화",
    revision: 7,
    calendarItems: [
      item({
        occurrenceId: "occ-1",
        blockId: "block-1",
        name: "서버 상태 점검",
        type: "HEALTH_CHECK",
        startAt: "2026-08-18T09:00:00+09:00",
        endAt: "2026-08-18T09:30:00+09:00",
        prompt: "매일 오전 9시에 EC2 상태를 확인하고 이상이 있으면 알려줘",
        actionSummary: "EC2와 RDS 상태 확인 후 이상 시 슬랙 알림",
      }),
      item({
        occurrenceId: "occ-2",
        blockId: "block-2",
        name: "AWS 비용 리포트",
        type: "REPORT",
        startAt: "2026-08-19T10:00:00+09:00",
        endAt: "2026-08-19T10:30:00+09:00",
        prompt: "매주 수요일 오전 10시에 AWS 비용 리포트를 만들어줘",
        actionSummary: "AWS 비용 집계 후 리포트를 이메일로 전송",
      }),
      item({
        occurrenceId: "occ-3",
        blockId: "block-3",
        name: "인프라 사용량 확인",
        type: "REPORT",
        startAt: "2026-08-20T11:00:00+09:00",
        endAt: "2026-08-20T11:30:00+09:00",
        prompt: "매주 목요일 인프라 사용량을 확인해줘",
        actionSummary: "인프라 사용량 수집 후 요약",
      }),
      item({
        occurrenceId: "occ-4",
        blockId: "block-4",
        name: "에러 로그 요약",
        type: "LOG",
        startAt: "2026-08-18T12:00:00+09:00",
        endAt: "2026-08-18T12:30:00+09:00",
        prompt: "매일 정오에 에러 로그를 요약해줘",
        actionSummary: "최근 에러 로그 수집 및 요약",
      }),
      item({
        occurrenceId: "occ-5",
        blockId: "block-5",
        name: "DB 백업 실행",
        type: "BACKUP",
        startAt: "2026-08-18T14:00:00+09:00",
        endAt: "2026-08-18T14:30:00+09:00",
        prompt: "매일 오후 2시에 DB 백업을 실행해줘",
        actionSummary: "RDS 백업 실행 후 결과 확인",
      }),
      item({
        occurrenceId: "occ-6",
        blockId: "block-6",
        name: "서버 상태 점검",
        type: "HEALTH_CHECK",
        startAt: "2026-08-18T09:00:00+09:00",
        endAt: "2026-08-18T09:30:00+09:00",
        prompt: "화요일 오전 9시에 보조 서버 상태도 확인해줘",
        actionSummary: "보조 EC2 상태 확인",
      }),
      item({
        occurrenceId: "occ-7",
        blockId: "block-7",
        name: "S3 파일 정리",
        type: "CLEANUP",
        startAt: "2026-08-19T17:00:00+09:00",
        endAt: "2026-08-19T17:30:00+09:00",
        prompt: "매주 수요일 오후 5시에 S3 파일을 정리해줘",
        actionSummary: "오래된 S3 파일 정리",
      }),
    ],
    storedBlocks: [
      {
        occurrenceId: "stored-1",
        blockId: "block-stored-1",
        name: "주간 보안 리포트",
        type: "REPORT",
        startAt: "2026-08-21T16:00:00+09:00",
        endAt: "2026-08-21T16:30:00+09:00",
        zoneId,
        overlapCount: 1,
        connectionStatus: "CONNECTED",
        latestRunStatus: "DRAFT",
        prompt: "매주 금요일 보안 리포트를 보내줘",
        actionSummary: "보안 이벤트를 모아 이메일로 전송",
        source: "STORAGE",
      },
    ],
  },
};

export const demoGeneration = {
  id: "generation-demo",
  status: "SUCCEEDED",
  assistantMessage: "자동화 업무를 생성했어요. 캘린더에 반영했습니다.",
};
