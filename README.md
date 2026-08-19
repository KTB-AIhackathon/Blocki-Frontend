# Blocki Frontend

Notion과 GitHub 작업 기록에서 만들어진 포트폴리오·이력서 Markdown을 조회하는 Vite + React 프론트엔드다.

## 실행

```bash
npm install
npm run dev
```

기본값은 백엔드 없이 동작하는 `mock` 모드다. 실제 Spring API를 연결할 때 `.env.local`에 다음 값을 설정한다.

```bash
VITE_DATA_MODE=api
VITE_API_ORIGIN=http://localhost:8080
```

## 경로

| 경로 | 화면 |
| --- | --- |
| `/login` | 이메일 로그인 |
| `/signup` | 이름·이메일·비밀번호 회원가입 |
| `/workspace` | 소스 연결 상태와 내 문서 목록 |
| `/documents` | 포트폴리오·이력서 탭과 버전별 Markdown 미리보기 |
| `/settings` | 사용자 정보와 소스 연동 상태 |

포트폴리오와 이력서는 모두 `/documents`를 사용한다. 탭을 바꿔도 URL은 바뀌지 않는다.

## 현재 구현 범위

- 이메일 기반 로그인과 회원가입.
- 현재 브라우저 탭에서 인증을 복원해 인증 화면의 새로고침과 직접 URL 진입 지원.
- GitHub·Notion 연결 상태 확인, 연결 시작 및 연결 해제.
- 연결된 서비스 기준 수집 범위 표시.
- 포트폴리오·이력서 목록, 버전 선택, 읽기 전용 Markdown 미리보기.
- 오늘 기록 부족 및 일부 데이터 조회 실패 안내.
- 브라우저 새로고침, 뒤로 가기, 직접 URL 진입을 지원하는 History API 경로 동기화.

문서 생성, Daily Scrum, TIL, Discord 공지 연동, 사용자 정보 수정과 비밀번호 변경은 현재 범위가 아니다. 연결 해제 API 경로와 응답은 백엔드 협의 전 임시 계약이다.

## 주요 구조

- `src/components`는 인증, 대시보드, 문서, 설정 화면을 담는다.
- `src/routing`은 URL과 화면 상태를 동기화한다.
- `src/state`는 인증과 문서 조회 상태를 관리한다.
- `src/api`는 백엔드 응답을 화면 모델로 변환한다.
- `src/mock`은 백엔드 없이 화면을 검증하는 데이터를 제공한다.
- `src/styles`는 화면별 CSS를 담는다.

## 검증

```bash
npm run lint
npm test -- --run
npm run build
```
