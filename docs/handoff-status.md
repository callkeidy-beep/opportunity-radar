# 인계 상태

갱신 2026-11-27 · 기준 `main@747796a` (11-27 확인, 변동 없음) · 작업 브랜치 `migration/claude-handoff` (push 완료) · PR https://github.com/callkeidy-beep/opportunity-radar/pull/1 · 운영 주소 `opportunity-radar-vert-pi.vercel.app`

## 완료
- 소스 조사와 감사 보고서 (`docs/migration-audit.md`)
- 수집기 결함 수정: 응답 형식 0건 버그 2건, 200+오류 본문 판별, 실패 응답 캐시 금지, KST 마감, 게시일 위조 제거, 타임아웃
- 화면 수정: XSS 차단, 실패 출처 이전 데이터 유지, 완료/일부/실패 토스트, 신규·마감일 미확인 표시, 메모 실제 시각
- `vercel.json` 서울 리전(`icn1`) — 403 가설 대응. 11-27 Preview 빌드 성공으로 설정 자체는 통과 확인. 403 해소 여부는 미확인
- fixture 테스트 14건 (`npm test`), Playwright 화면 검사
- 11-26 브랜치 push, PR #1 생성. 11-27 기준 PR 열림, 충돌 없음(`mergeable_state: clean`)
- 11-27 Vercel Preview 배포 성공 (GitHub 상태 "Deployment has completed"). Preview 주소는 PR #1의 Vercel 봇 댓글 참조
- 문서: `CLAUDE.md`, `.env.example`, `.gitignore`, README 보완, `docs/*`

## 막힘 (Michael 조치 필요)
| 항목 | 필요한 행동 | 위치 |
|---|---|---|
| Preview 화면 확인 | Preview에서 "새 공고 수집" → "출처 관리" 화면 캡처 | PR #1 Vercel 봇 댓글의 Preview 링크 |
| PR 검토·병합 | Preview 확인 후 승인 | GitHub PR #1 |
| Vercel 프로젝트·로그·환경변수 확인 | 팀 `callkeidy-2412s-projects` 접근 승인 (11-27에도 403) | Claude가 새로 만든 Vercel 승인 링크 |
| 403 재현 | 오류 화면 캡처, 발생 시각, 주소창 URL | 대화로 전달 (키 값은 제외) |
| 비활성 버튼 | 어느 화면의 어떤 버튼인지 캡처 | 대화로 전달 |

## 확인됨
- 운영 주소 `opportunity-radar-vert-pi.vercel.app`, Vercel 프로젝트 `opportunity-radar` (팀 `callkeidy-2412s-projects`)
- GitHub 연결: push 시 Preview 자동 배포

## 미확인
- 환경변수 설정 여부, 실제 수집 건수, 실제 API 응답 형식, 기존 ChatGPT 주간 알림(앱과 무관, 이전되지 않음)

## 다음 작업
1. Preview에서 출처 관리 화면의 출처별 상태 확인 (Preview 배포 자체는 성공)
2. Vercel 런타임 로그로 403 계층 확정
3. 팀 공유가 필요하면 DB+로그인 설계안 작성(비용 포함) 후 승인
4. 승인 후 `main` 병합
