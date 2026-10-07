# 기회레이더

공공기관·기업 지원사업, 공모, 입찰, 행사 정보를 모아 검색하고 팀에서 검토하는 웹앱입니다.

## 배포 구조

- 화면: `app/index.html`을 빌드해 Vercel 정적 파일로 제공합니다.
- API: `api/[...path].js`가 `worker/entry-template.mjs`의 서버 수집기를 Vercel Functions에서 실행합니다.
- 비밀값: 조달청과 기업마당 키는 Vercel 환경변수로만 설정합니다. 브라우저 코드와 GitHub 저장소에 넣지 않습니다.
- 데이터 보관: 담당자·메모·저장 상태는 현재 브라우저의 localStorage에 저장됩니다. 여러 사용자가 같은 데이터를 보려면 다음 단계에서 데이터베이스와 로그인을 연결해야 합니다.

## 로컬 실행

Node.js 20 이상과 Vercel CLI가 필요합니다.

```bash
npm install -g vercel
vercel dev
```

화면만 빌드하려면:

```bash
npm run build
npm run validate
```

## GitHub와 Vercel 연결

1. GitHub에 이 폴더의 파일을 새 저장소로 올립니다.
2. Vercel에서 **Add New → Project**를 선택하고 해당 GitHub 저장소를 가져옵니다.
3. Root Directory가 `opportunity-radar` 같은 하위 폴더라면 그 경로를 지정합니다. 이 폴더 자체를 저장소로 만들면 기본값을 씁니다.
4. Build Command는 `npm run build`, Output Directory는 `public`으로 둡니다. `vercel.json`에 같은 값이 들어 있습니다.
5. Vercel의 Project Settings → Environment Variables에 필요한 키를 등록합니다.

| 이름 | 용도 |
| --- | --- |
| `G2B_SERVICE_KEY` | 조달청 나라장터 입찰공고 API |
| `CUSTOMS_SERVICE_KEY` | 관세청 품목별 국가별 수출입실적 API |
| `BIZINFO_SUPPORT_KEY` | 기업마당 지원사업 피드 |
| `BIZINFO_EVENT_KEY` | 기업마당 행사정보 피드 |

키를 등록한 뒤 다시 배포하면 공고 화면의 **새 공고 수집** 버튼이 서버 API를 호출합니다. 키가 없는 출처는 연결 실패로 표시됩니다. 문체부 공지·보도자료 RSS는 키 없이 서버에서 가져옵니다. 관세청 통계의 기본 국가는 미국(US)이며 필요하면 `/api/customs-trade?country=KR&hs=XXXX` 형식으로 국가와 HS 코드를 지정할 수 있습니다.

## API 경로

- `GET /api/g2b`
- `GET /api/customs-trade`
- `GET /api/mcst-rss`
- `GET /api/mcst-press-rss`
- `GET /api/bizinfo/support`
- `GET /api/bizinfo/events`

응답 형식은 `{ "ok": true, "count": 0, "items": [] }`입니다. 지원자격·마감·예산은 원문에서 최종 확인해야 합니다.
