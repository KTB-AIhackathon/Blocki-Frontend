---
description: 현재 Blocki 프론트엔드와 실제 연동하기 위해 백엔드에 필요한 변경 사항을 정리합니다.
---

# 백엔드 필요 변경 사항

## 반드시 필요한 변경

### OAuth 인가 시작 계약

현재 `GET /api/v1/integrations/{provider}/authorize`는 Bearer 인증이 필요하지만 OAuth 팝업 이동에는 `Authorization` 헤더를 넣을 수 없다. 프론트는 먼저 인증된 API 요청으로 인가 URL을 받은 뒤 팝업을 해당 URL로 이동한다.

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

`authorizeUrl`은 HTTPS 절대 URL이어야 한다. 프론트는 팝업이 차단되면 API 요청을 보내지 않고 사용자에게 팝업 허용 안내를 표시한다.

### OAuth 콜백의 프론트 리디렉션

OAuth 코드 교환과 토큰 암호화 저장은 백엔드가 처리한다. 완료 후에는 백엔드 화면이 아니라 프론트의 다음 경로로 리디렉션해야 한다.

```text
{FRONTEND_ORIGIN}/oauth/callback?provider=github&result=success
```

실패 시에는 `result=failed`와 오류 코드를 전달한다.

```text
{FRONTEND_ORIGIN}/oauth/callback?provider=notion&result=failed&error=OAUTH_AUTHORIZATION_DENIED
```

프론트 콜백 화면은 같은 출처의 부모 창에 완료 메시지를 보내고 팝업을 닫는다. 부모 창은 메시지를 받은 뒤 `GET /api/v1/integrations`를 다시 호출한다. OAuth access token과 refresh token은 프론트에 전달하지 않는다.

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
