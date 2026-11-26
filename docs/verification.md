# 검증 결과

실행일 2026-11-26 · 환경: Claude Code 클라우드 컨테이너, Node 22 · 브랜치 `migration/claude-handoff`

| 항목 | 방법 | 기대 | 실제 | 결과 |
|---|---|---|---|---|
| 빌드 | `npm run build` | 생성물 갱신 | 성공 | 통과 |
| worker 모듈 검사 | `npm run validate` | `default.fetch` 존재 | 성공 | 통과 |
| 키 없음 | fixture | 503, `ok:false`, `no-store` | 일치 | 통과 |
| 나라장터 정상·필터 | fixture (배열 형식) | 미디어 공고 1건 | 1건 | 통과 (수정 전 0건) |
| 나라장터 `items.item` 형식 | fixture | 1건 | 1건 | 통과 |
| 0건 정상 | fixture | `ok:true,count:0` | 일치 | 통과 |
| 외부 403 | fixture | 502, `layer:upstream`, `upstreamStatus:403` | 일치 | 통과 |
| 200 + XML 인증 오류 | fixture | `ok:false`, 코드 표시 | 일치 | 통과 |
| 200 + HTML 페이지 | fixture | `ok:false` | 일치 | 통과 |
| 마감 당일(KST) 유지·전일 제외 | fixture | 당일만 남음 | 일치 | 통과 |
| 게시일 누락 | fixture | `start:null` | 일치 | 통과 |
| 타임아웃 | fixture | 502 | 일치 | 통과 |
| 기업마당 마감 필터·상시 | fixture | 마감 지난 공고 제외, 상시 유지 | 일치 | 통과 (수정 전 0건) |
| 기업마당 HTML 차단 페이지 | fixture | `ok:false` | 일치 | 통과 |
| custom-source 주소 제한 | fixture | 비 `.go.kr` 400 | 일치 | 통과 |
| XSS 차단 | Playwright, 악성 제목·설명·`javascript:` 링크 주입 | 스크립트 미실행, 링크 `#` | 일치 (데스크톱·모바일 390px) | 통과 |
| 실패 시 이전 데이터 유지 | Playwright, 2회차 수집 실패 | 기존 2건 유지 + "이전 수집분" | 일치 | 통과 |
| "마감일 미확인" 표시 | Playwright | 칩 표시 | 일치 | 통과 |

fixture 테스트 14건 전부 통과 (`npm test`).

## 미실행

| 항목 | 이유 |
|---|---|
| 출처별 실제 API 호출 | 이 컨테이너의 네트워크 정책이 `apis.data.go.kr`, `www.bizinfo.go.kr`를 차단(프록시 403). 실제 키도 없음 |
| 실제 응답 형식 대조 | 위와 같음. 배열·객체 두 형식을 모두 처리하도록 했다 |
| Vercel Preview 배포·로그 | Vercel 팀 권한 미승인 |
| `icn1` 리전 적용 효과 | Preview 배포 후 기업마당 수집 결과로 확인 필요 |
| GitHub push·PR | 이 세션에 저장소 쓰기 권한 미부여 |
| 관심 목록 재접속 복원 | localStorage 방식이라 같은 브라우저에서만 유지됨. 구조상 다른 기기 복원 불가 |
