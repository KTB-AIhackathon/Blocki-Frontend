---
description: 현재 Blocki 프론트엔드와 실제 연동하기 위해 백엔드에 필요한 변경 사항을 정리합니다.
---

# 백엔드 필요 변경 사항

## 반드시 필요한 변경

### OAuth 인가 시작 계약

현재 `GET /api/v1/integrations/{provider}/authorize`는 Bearer 인증이 필요하지만 브라우저 전체 이동에는 `Authorization` 헤더를 넣을 수 없다. 이 상태에서는 로그인 사용자가 `연결하기`를 눌러도 `401`이 발생한다.

권장 계약은 인증된 JSON endpoint가 인가 URL을 반환하는 방식이다.

```http
POST /api/v1/integrations/{provider}/authorize-url
Authorization: Bearer <accessToken>
```

```json
{
  "data": {
    "authorizeUrl": "https://provider.example/oauth/..."
  }
}
```

프론트는 이 응답을 받은 뒤 `authorizeUrl`로 이동한다.

### 연결 해제 endpoint

프론트는 다음 endpoint를 사용하지만 현재 백엔드에는 구현되어 있지 않다.

```http
DELETE /api/v1/integrations/{provider}
Authorization: Bearer <accessToken>
```

성공 응답은 해당 제공자의 `NOT_CONNECTED` 상태를 반환해야 한다. 이미 해제된 상태도 같은 성공 응답을 반환하는 멱등 동작을 권장한다.

## 응답 계약 보완

### 특정 버전 식별자

현재 특정 버전 조회 응답의 `id`는 버전 ID가 아니라 문서 ID다. 프론트는 요청 URL의 `versionId`를 사용해 우회하고 있다. 장기 계약에서는 다음처럼 두 식별자를 분리해야 한다.

```json
{
  "data": {
    "documentId": "document-id",
    "versionId": "version-id"
  }
}
```

### 부족하거나 누락된 데이터

프론트는 문서 목록의 `notice`와 `missingData`를 처리하지만 현재 백엔드 목록 응답에는 두 필드가 없다. 오늘 기록 부족은 `INSUFFICIENT_DATA`, 일부 소스 실패는 `PARTIAL_DATA`와 누락 제공자 목록으로 반환해야 한다.

## 로컬 실행에 필요한 설정

- `INTEGRATION_TOKEN_ENCRYPTION_KEY`가 없으면 연동 controller와 service가 생성되지 않는다.
- GitHub 연동에는 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`가 필요하다.
- Notion 연동에는 `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI`가 필요하다.
- 문서 생성 worker에는 `AI_BASE_URL`, `AI_INTERNAL_KEY`가 필요하다. 없으면 생성 작업이 `QUEUED`에 머문다.
- Spring Boot는 별도 설정 없이 저장소의 `.env` 파일을 자동으로 읽지 않는다. 실행 환경변수 주입 방법을 README 또는 실행 설정에 명시해야 한다.

## 프론트에서 이미 대응한 항목

- 백엔드에 없는 `/users/me`를 호출하지 않고 로그인 응답의 사용자와 만료 시간을 현재 탭에 저장한다.
- Vite 개발 서버의 `/api` 요청을 `http://localhost:8080`으로 proxy한다.
- 문서 생성 요청과 작업 상태 조회 endpoint를 현재 백엔드 코드에 맞춰 사용한다.
- 특정 버전 응답의 잘못된 `id`는 요청 URL의 `versionId`로 보정한다.
