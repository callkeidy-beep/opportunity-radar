# 기회레이더 — Claude 작업 지침

## 구조
- `app/index.html` — 화면 전체(HTML·CSS·JS 한 파일). 원본은 여기만 고친다.
- `worker/entry-template.mjs` — 서버 수집기 원본. `/api/*` 라우팅과 출처별 어댑터.
- `scripts/build.sh` — 템플릿에 화면을 넣어 `worker/index.js`·`dist/`·`public/index.html`을 생성한다. 이 세 경로는 생성물이다. 손으로 고치지 않는다.
- `api/[...path].js` — Vercel 함수가 `worker/index.js`의 `fetch`를 호출하는 어댑터.
- `tests/worker.test.mjs` — 네트워크 없는 fixture 테스트.

## 명령
- `npm run build` — 생성물 갱신. 커밋 전에 반드시 실행.
- `npm test` — 빌드 + fixture 테스트.
- `npm run validate` — 생성된 worker가 ESM `default.fetch`를 내보내는지 검사.
- 로컬 실행은 `vercel dev`(Vercel CLI 필요).

## 원칙
- 비밀값은 Vercel 환경변수에만 둔다. 이름은 `.env.example`과 일치시킨다.
- 실패를 빈 목록으로 위장하지 않는다. 0건 정상(`ok:true,count:0`)과 실패(`ok:false`)를 구분한다.
- 마감 판정 기준은 Asia/Seoul 해당일 23:59:59. 날짜가 없으면 `null`로 두고 "미확인"으로 표시한다.
- 외부 API에서 온 문자열은 화면에 넣기 전에 `escapeHTML`, 링크는 `safeLink`를 거친다.
- 사용자 데이터(저장·메모·평가·출처 설정)는 브라우저 localStorage `radar_v1`에 있다. 키 구조를 바꾸면 기존 데이터가 사라진다.
- main 병합·운영 배포·Vercel 설정 변경은 Michael의 승인 후에만 한다.
