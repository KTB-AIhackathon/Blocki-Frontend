# Blocki Frontend

Notion과 GitHub 작업 기록에서 만들어진 포트폴리오·이력서 Markdown을 조회하는 Vite + React 프론트엔드다.

## 실행

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:8080`에서 실행되는 Spring API를 Vite 개발 proxy로 연결한다.

Docker 이미지에서는 nginx가 `/api`를 Spring으로 넘기므로 `VITE_API_ORIGIN`은 비워 둔다. 워크스페이스 루트에서 `./up.sh`로 세 레포를 같이 띄운다.

배포 빌드에서 프록시 없이 다른 호스트를 쓸 때만 `VITE_API_ORIGIN`을 지정한다.

## 경로

| 경로 | 화면 |
| --- | --- |
| `/login` | 이메일 로그인 |
| `/signup` | 이름·이메일·비밀번호 회원가입 |
| `/oauth/callback` | GitHub·Notion OAuth 팝업 결과 |
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
- 이력서·포트폴리오 생성 작업 요청과 완료 후 목록 갱신.
- 오늘 기록 부족 및 일부 데이터 조회 실패 안내.
- 브라우저 새로고침, 뒤로 가기, 직접 URL 진입을 지원하는 History API 경로 동기화.

Daily Scrum, TIL, Discord 공지 연동, 사용자 정보 수정과 비밀번호 변경은 현재 범위가 아니다.

## 주요 구조

- `src/components`는 인증, 대시보드, 문서, 설정 화면을 담는다.
- `src/routing`은 URL과 화면 상태를 동기화한다.
- `src/state`는 인증과 문서 조회 상태를 관리한다.
- `src/api`는 백엔드 응답을 화면 모델로 변환한다.
- `src/styles`는 화면별 CSS를 담는다.

## 검증

```bash
npm run lint
npm test -- --run
npm run build
```
