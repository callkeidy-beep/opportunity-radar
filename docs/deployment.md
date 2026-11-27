# GitHub·Vercel 연결과 운영

## GitHub
- 저장소: `callkeidy-beep/opportunity-radar` (공개). 기본 브랜치 `main`.
- 작업 흐름: `main`에서 작업 브랜치 → PR → Michael 승인 → 병합.
- 저장소가 **공개**다. 비밀값이 커밋되지 않게 `.gitignore`가 `.env*`를 막는다. 현재 커밋 이력에서 키 값은 발견하지 못했다.
- Claude Code 웹에서 push하려면 GitHub 앱이 이 저장소에 쓰기 권한을 가져야 한다.

## Vercel
- 설정: Build `npm run build`, Output `public`, 함수 `api/[...path].js` (30초), 리전 `icn1`(이번 브랜치에서 추가).
- `main` 병합 시 운영 자동 배포가 일어날 가능성이 높다 [미확인 — Vercel 권한 필요]. 그래서 작업 브랜치로만 push한다. 브랜치 push는 보통 Preview 배포를 만든다.
- 환경변수: `.env.example`의 5개 이름. Production·Preview 범위를 각각 확인한다. Preview에 운영 키를 공유해도 이 앱은 읽기만 하므로 DB 오염 위험은 없다(DB 없음). 다만 호출 한도는 공유된다.
- data.go.kr 키는 **디코딩(Decoding) 키**를 넣는다. 코드가 URL 인코딩을 한 번 더 하므로 인코딩 키를 넣으면 "키 미등록" 오류가 난다.

## 수집 운영
- 수집 주체: 사용자 브라우저. 페이지 열 때 1회 + "새 공고 수집" 버튼. 서버 스케줄 없음.
- 결과 확인: 화면 토스트(완료/일부/실패), "출처 관리" 화면의 출처별 상태 칩(건수 또는 오류 사유).
- 실패 시: 해당 출처의 이전 공고는 "이전 수집분"으로 남는다. 새로고침하면 사라진다(서버 저장 없음).
- 장애 대응 순서:
  1. 출처 관리에서 오류 문구 확인.
  2. "키가 설정되지 않았습니다" → Vercel 환경변수 등록 후 재배포.
  3. "인증·서비스 오류 30" 등 → data.go.kr 마이페이지에서 활용 승인·키 종류 확인.
  4. "응답 오류 (403)" → 외부 기관 차단. 리전(`icn1`) 확인, 기관 이용 조건 확인.
  5. 화면 전체가 403 → Vercel Deployment Protection 설정 확인.

## 롤백
- 코드: Vercel 대시보드 Deployments에서 이전 Production 배포를 "Promote"(또는 Instant Rollback).
- 데이터: 서버 데이터가 없어 롤백 대상 없음. 브라우저 localStorage `radar_v1` 키 구조는 이번 변경에서 유지했고 `firstSeen`, `seenInit` 필드만 추가했다.
