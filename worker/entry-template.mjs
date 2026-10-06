const page = __PAGE_JSON__;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "public, s-maxage=300, stale-while-revalidate=600" };
const EVENT_TERMS = ["행사", "축제", "운영", "홍보", "광고", "콘텐츠", "영상", "제작", "문화", "캠페인", "전시", "공연", "포럼", "컨퍼런스", "박람회", "마라톤", "스포츠", "미디어"];
const NOTICE_TERMS = /(지원|공모|모집|행사|입찰|용역|콘텐츠|마케팅|홍보|영상|축제|협력|선정|문화|미디어)/;
const response = (data, status=200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const xmlText = (s="") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
const tag = (block, name) => xmlText(block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1] || "");
function dateOnly(value) {
  const raw=String(value||"").replace(/\D/g,"");
  return raw.length>=8 ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : null;
}
function currentKstWindow() {
  const kstNow = new Date(Date.now()+9*60*60*1000);
  const end = kstNow.toISOString().slice(0,10).replaceAll("-","");
  const start = new Date(kstNow.getTime()-14*24*60*60*1000).toISOString().slice(0,10).replaceAll("-","");
  return { begin:`${start}0000`, end:`${end}2359` };
}
function toG2BItem(x) {
  const title=String(x.bidNtceNm||x.bidNtceNmEng||"").replace(/<[^>]*>/g,"").trim();
  if (!title || !EVENT_TERMS.some(term=>title.includes(term))) return null;
  const close=dateOnly(x.bidClseDt||x.bidClseDtFmt);
  const now=new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Seoul"}));
  if (close && new Date(close+"T23:59:59")<now) return null;
  const id=`g2b-${x.bidNtceNo||title}-${x.bidNtceOrd||"0"}`;
  const date=dateOnly(x.ntceDt||x.bidNtceDt||x.bidNtceRegDt) || new Date().toISOString().slice(0,10);
  const amount=Number(x.asignBdgtAmt||x.presmptPrce||0);
  const budget=amount ? `${new Intl.NumberFormat("ko-KR").format(amount)}원` : "공고 원문 확인";
  const org=x.ntceInsttNm||x.dminsttNm||"나라장터 공고기관";
  const detail=x.bidNtceDtlUrl||"https://www.g2b.go.kr/";
  const field=/축제|행사|공연|전시|마라톤|스포츠/.test(title)?"행사·축제":"콘텐츠·미디어";
  return {id,title,org,source:"나라장터",field,kind:"용역입찰",deadline:close,start:date,budget,match:/행사|축제|공연|전시|콘텐츠|미디어/.test(title)?91:78,open:true,link:detail,description:`나라장터 입찰공고 API에서 수집한 용역 공고입니다. 공고기관: ${org}. 참가자격과 과업 범위는 원문과 제안요청서에서 확인하세요.`,requirements:"입찰참가자격, 유사 실적, 공동수급 허용 여부, 제출 서류와 평가 기준을 원문에서 확인",idea:"콘텐츠 기획·영상·행사 운영·온라인 홍보를 결합할 수 있는지 제안요청서의 과업 범위부터 대조합니다.",demo:false,live:true};
}
async function getG2B(env) {
  if (!env.G2B_SERVICE_KEY) return response({ok:false,source:"나라장터",error:"API 서비스 키가 설정되지 않았습니다.",items:[]},503);
  const {begin,end}=currentKstWindow();
  const u=new URL("https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc");
  for (const [k,v] of Object.entries({ServiceKey:env.G2B_SERVICE_KEY,type:"json",inqryDiv:"1",inqryBgnDt:begin,inqryEndDt:end,pageNo:"1",numOfRows:"100"})) u.searchParams.set(k,v);
  let upstream;
  try { upstream=await fetch(u.toString(),{headers:{accept:"application/json"},cf:{cacheTtl:300,cacheEverything:true}}); }
  catch { return response({ok:false,source:"나라장터",error:"조달청 API에 연결하지 못했습니다.",items:[]},502); }
  if (!upstream.ok) return response({ok:false,source:"나라장터",error:`조달청 API 응답 오류 (${upstream.status}).`,items:[]},502);
  let payload;
  try { payload=await upstream.json(); } catch { return response({ok:false,source:"나라장터",error:"API 응답 형식을 확인할 수 없습니다.",items:[]},502); }
  const head=payload?.response?.header;
  const body=payload?.response?.body;
  if (head && !["00","0"].includes(String(head.resultCode))) return response({ok:false,source:"나라장터",error:`조달청 API 코드 ${head.resultCode||"확인 불가"}: ${head.resultMsg||"요청 실패"}`,items:[]},502);
  let rows=body?.items?.item||[];
  if (!Array.isArray(rows)) rows=rows?[rows]:[];
  const items=rows.map(toG2BItem).filter(Boolean).slice(0,60);
  return response({ok:true,source:"나라장터",updatedAt:new Date().toISOString(),count:items.length,items});
}

function bizinfoRows(payload) {
  const root=payload?.jsonArray||payload?.response||payload;
  let rows=root?.item||root?.items||[];
  if (!Array.isArray(rows)) rows=rows?[rows]:[];
  return rows;
}
function periodEnd(value) {
  const text=String(value||"");
  const matches=[...text.matchAll(/(20\d{2})[-./ ]?(\d{2})[-./ ]?(\d{2})/g)];
  return matches.length?`${matches.at(-1)[1]}-${matches.at(-1)[2]}-${matches.at(-1)[3]}`:null;
}
function cleanHtml(value="") { return String(value).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim(); }
function mapBizinfoSupport(row,i) {
  const title=row.title||row.pblancNm||"";
  if (!title) return null;
  const period=row.reqstMthPapersCn||row.reqstBeginEndDe||row.reqstDt||"";
  const deadline=periodEnd(period);
  const id=row.seq||row.pblancId||`support-${i}`;
  return {id:`bizinfo-${id}`,title,org:row.author||row.jrsdInsttNm||row.excInsttNm||"기업마당 공고기관",source:"기업마당",field:row.lcategory||row.pldirSportRealmLclasCodeNm||"창업·경영",kind:"지원사업",deadline,start:dateOnly(row.pubDate||row.creatPnttm)||new Date().toISOString().slice(0,10),budget:"공고 원문 확인",match:84,open:!deadline||new Date(deadline+"T23:59:59")>=new Date(),link:row.pblancUrl||row.link||row.pblancUrl||"https://www.bizinfo.go.kr/",description:cleanHtml(row.bsnsSumryCn||row.description||"기업마당 지원사업 API에서 수집했습니다."),requirements:`지원 대상: ${row.trgetNm||"원문 확인"}. 신청기간과 제출서류는 원문에서 확인하세요.`,idea:"사업 목적과 당사 콘텐츠·행사 역량을 대조한 뒤 제작·홍보·지역 행사 제안으로 연결합니다.",demo:false,live:true};
}
function mapBizinfoEvent(row,i) {
  const title=row.title||row.nttNm||"";
  if (!title) return null;
  const deadline=periodEnd(row.rceptPd||row.receptionPeriod||"");
  const id=row.seq||row.eventInfoId||`event-${i}`;
  return {id:`bizinfo-event-${id}`,title,org:row.originOrg||row.originEngnNm||"행사 주관기관 원문 확인",source:"기업마당",field:row.lcategory||row.eventType||row.eventInfoTyNm||"행사·축제",kind:row.eventType||row.eventInfoTyNm||"행사정보",deadline,start:dateOnly(row.registDe||row.pubDate)||new Date().toISOString().slice(0,10),budget:"참가 조건 원문 확인",match:79,open:!deadline||new Date(deadline+"T23:59:59")>=new Date(),link:row.originUrl||row.originUrlAdres||row.bizinfoUrl||row.link||"https://www.bizinfo.go.kr/",description:cleanHtml(row.description||row.nttCn||"기업마당 행사정보 API에서 수집했습니다."),requirements:"참가 대상, 접수기간, 행사 일정과 비용을 원문에서 확인하세요.",idea:"포럼·세미나·전시 정보를 파트너 발굴과 콘텐츠 취재 기회로 검토합니다.",demo:false,live:true};
}
async function getBizinfo(env, kind) {
  const serviceKey=kind==="event"?env.BIZINFO_EVENT_KEY:env.BIZINFO_SUPPORT_KEY;
  if (!serviceKey) return response({ok:false,source:kind,error:"기업마당 서비스 키가 필요합니다.",items:[]},503);
  const isEvent=kind==="event";
  const endpoint=isEvent?"https://www.bizinfo.go.kr/uss/rss/bizinfoEventApi.do":"https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
  const u=new URL(endpoint);
  u.searchParams.set("crtfcKey",serviceKey);
  u.searchParams.set("dataType","json");
  u.searchParams.set("searchCnt","100");
  u.searchParams.set("pageUnit","100");
  u.searchParams.set("pageIndex","1");
  let upstream;
  try { upstream=await fetch(u.toString(),{headers:{accept:"application/json"},cf:{cacheTtl:300,cacheEverything:true}}); }
  catch { return response({ok:false,source:kind,error:"기업마당 API에 연결하지 못했습니다.",items:[]},502); }
  if (!upstream.ok) return response({ok:false,source:kind,error:`기업마당 API 응답 오류 (${upstream.status}).`,items:[]},502);
  let payload;
  try { payload=await upstream.json(); } catch { return response({ok:false,source:kind,error:"기업마당 API 응답 형식을 확인할 수 없습니다.",items:[]},502); }
  const mapper=isEvent?mapBizinfoEvent:mapBizinfoSupport;
  const items=bizinfoRows(payload).map(mapper).filter(Boolean).filter(item=>item.open).slice(0,80);
  return response({ok:true,source:kind,updatedAt:new Date().toISOString(),count:items.length,items});
}
async function getCultureRss() {
  let upstream;
  try { upstream=await fetch("https://www.mcst.go.kr/common/rss/notice.jsp",{headers:{accept:"application/rss+xml, application/xml, text/xml"},cf:{cacheTtl:600,cacheEverything:true}}); }
  catch { return response({ok:false,source:"문화체육관광부 RSS",error:"문체부 RSS에 연결하지 못했습니다.",items:[]},502); }
  if (!upstream.ok) return response({ok:false,source:"문화체육관광부 RSS",error:`문체부 RSS 응답 오류 (${upstream.status}).`,items:[]},502);
  const text=await upstream.text();
  const items=[...text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m,i)=>{
    const b=m[1], title=tag(b,"title"), link=tag(b,"link"), description=tag(b,"description"), pubDate=tag(b,"pubDate");
    if (!title || !NOTICE_TERMS.test(title)) return null;
    const date=pubDate ? new Date(pubDate) : null;
    return {id:`mcst-${link||i}`,title,org:"문화체육관광부",source:"문화·지역기관",field:/행사|축제|공연|전시|관광/.test(title)?"행사·축제":"콘텐츠·미디어",kind:"공고·정책 알림",deadline:null,start:date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):new Date().toISOString().slice(0,10),budget:"원문 확인",match:76,open:true,link:link||"https://www.mcst.go.kr/",description:description||"문체부 RSS에서 수집한 공지입니다. 모집 기간·지원 자격은 원문에서 확인하세요.",requirements:"RSS에는 마감일과 세부 자격이 포함되지 않을 수 있습니다. 공고 원문과 첨부파일을 확인하세요.",idea:"공고 성격을 확인한 뒤 문화·관광·콘텐츠 행사 또는 제작 제안으로 연결 가능한지 검토합니다.",demo:false,live:true};
  }).filter(Boolean).slice(0,30);
  return response({ok:true,source:"문화체육관광부 RSS",updatedAt:new Date().toISOString(),count:items.length,items});
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if (request.method!=="GET") return new Response("Method not allowed",{status:405,headers:{allow:"GET"}});
    if (url.pathname==="/api/g2b") return getG2B(env);
    if (url.pathname==="/api/bizinfo/support") return getBizinfo(env,"support");
    if (url.pathname==="/api/bizinfo/events") return getBizinfo(env,"event");
    if (url.pathname==="/api/mcst-rss") return getCultureRss();
    if (url.pathname!=="/") return new Response("Not found",{status:404});
    return new Response(page,{headers:{"content-type":"text/html; charset=utf-8","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
  },
};
