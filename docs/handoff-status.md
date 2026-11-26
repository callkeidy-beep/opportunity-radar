# 인계 상태

갱신 2026-11-26 · 기준 `main@747796a` · 작업 브랜치 `migration/claude-handoff` (로컬 커밋, **push 안 됨**)

## 완료
- 소스 조사와 감사 보고서 (`docs/migration-audit.md`)
- 수집기 결함 수정: 응답 형식 0건 버그 2건, 200+오류 본문 판별, 실패 응답 캐시 금지, KST 마감, 게시일 위조 제거, 타임아웃
- 화면 수정: XSS 차단, 실패 출처 이전 데이터 유지, 완료/일부/실패 토스트, 신규·마감일 미확인 표시, 메모 실제 시각
- `vercel.json` 서울 리전(`icn1`) — 403 가설 대응, 병합 전 확인 필요
- fixture 테스트 14건 (`npm test`), Playwright 화면 검사
- 문서: `CLAUDE.md`, `.env.example`, `.gitignore`, README 보완, `docs/*`

## 막힘 (Michael 조치 필요)
| 항목 | 필요한 행동 | 위치 |
|---|---|---|
| GitHub push·PR | 이 세션의 저장소 쓰기 허용 | Claude Code 권한 승인 / GitHub 앱 설치 범위 |
| Vercel 프로젝트·로그·환경변수 확인 | 팀 `callkeidy-2412s-projects` 접근 승인 링크 열기 | Claude가 제공하는 Vercel 승인 링크 |
| 403 재현 | 오류 화면 캡처, 발생 시각, 주소창 URL | 대화로 전달 (키 값은 제외) |
| 비활성 버튼 | 어느 화면의 어떤 버튼인지 캡처 | 대화로 전달 |

## 미확인
- 운영 URL, Vercel 프로젝트명, 환경변수 설정 여부, 실제 API 응답 형식, 기존 ChatGPT 주간 알림(앱과 무관, 이전되지 않음)

## 다음 작업
1. 브랜치 push → Preview 배포 → 출처 관리 화면에서 출처별 상태 확인
2. Vercel 런타임 로그로 403 계층 확정
3. 팀 공유가 필요하면 DB+로그인 설계안 작성(비용 포함) 후 승인
4. 승인 후 `main` 병합
