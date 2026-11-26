// Fixture tests: no network, no real keys. globalThis.fetch is replaced per test.
import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const ENV = { G2B_SERVICE_KEY: "dummy", BIZINFO_SUPPORT_KEY: "dummy", BIZINFO_EVENT_KEY: "dummy" };
const realFetch = globalThis.fetch;
function mockFetch(fn) { globalThis.fetch = async (url, init) => fn(String(url), init); }
test.afterEach(() => { globalThis.fetch = realFetch; });
const call = async (path, env = ENV) => {
  const r = await worker.fetch(new Request("https://radar.test" + path), env);
  return { status: r.status, cache: r.headers.get("cache-control"), body: await r.json() };
};
const kstDate = (offsetDays) => new Date(Date.now() + 9 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);
const g2bRow = (o) => ({ bidNtceNo: "R1", bidNtceOrd: "000", bidNtceNm: "지역축제 홍보 영상 제작 용역", ntceInsttNm: "테스트시", ntceDt: "2026-11-20 10:00:00", bidClseDt: kstDate(5) + " 10:00", bidNtceDtlUrl: "https://www.g2b.go.kr/x", ...o });
const g2bPayload = (rows) => ({ response: { header: { resultCode: "00", resultMsg: "OK" }, body: { items: rows } } });

test("missing key → 503, not an empty success", async () => {
  const r = await call("/api/g2b", {});
  assert.equal(r.status, 503); assert.equal(r.body.ok, false);
  assert.equal(r.cache, "no-store", "failures must not be CDN-cached");
});

test("G2B normal response maps and keeps open notices", async () => {
  mockFetch(() => Response.json(g2bPayload([g2bRow({}), g2bRow({ bidNtceNo: "R2", bidNtceNm: "도로 포장 공사" })])));
  const r = await call("/api/g2b");
  assert.equal(r.body.ok, true); assert.equal(r.body.count, 1, "non-media title filtered out");
  assert.equal(r.body.items[0].id, "g2b-R1-000");
});

test("G2B legacy shape items.item also parses", async () => {
  mockFetch(() => Response.json({ response: { header: { resultCode: "00" }, body: { items: { item: g2bRow({}) } } } }));
  const r = await call("/api/g2b");
  assert.equal(r.body.count, 1);
});

test("Bizinfo legacy shape jsonArray.item also parses", async () => {
  mockFetch(() => Response.json({ jsonArray: { item: [{ seq: "9", title: "행사", reqstBeginEndDe: "상시" }] } }));
  const r = await call("/api/bizinfo/support");
  assert.equal(r.body.count, 1);
});

test("G2B zero rows is ok:true count 0 (distinct from failure)", async () => {
  mockFetch(() => Response.json(g2bPayload([])));
  const r = await call("/api/g2b");
  assert.equal(r.body.ok, true); assert.equal(r.body.count, 0);
});

test("G2B upstream 403 is reported with layer and status", async () => {
  mockFetch(() => new Response("Forbidden", { status: 403 }));
  const r = await call("/api/g2b");
  assert.equal(r.status, 502); assert.equal(r.body.layer, "upstream"); assert.equal(r.body.upstreamStatus, 403);
});

test("G2B 200 with XML auth error is a failure, not a parse mystery", async () => {
  mockFetch(() => new Response("<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>", { status: 200 }));
  const r = await call("/api/g2b");
  assert.equal(r.body.ok, false); assert.match(r.body.error, /30/); assert.match(r.body.error, /SERVICE_KEY_IS_NOT_REGISTERED/);
});

test("G2B 200 with HTML page is a failure", async () => {
  mockFetch(() => new Response("<html><body>점검중</body></html>", { status: 200 }));
  const r = await call("/api/g2b");
  assert.equal(r.body.ok, false); assert.match(r.body.error, /HTML/);
});

test("deadline today (KST) is still open; yesterday is closed", async () => {
  mockFetch(() => Response.json(g2bPayload([g2bRow({ bidNtceNo: "T", bidClseDt: kstDate(0) }), g2bRow({ bidNtceNo: "Y", bidClseDt: kstDate(-1) })])));
  const r = await call("/api/g2b");
  assert.deepEqual(r.body.items.map((i) => i.id), ["g2b-T-000"]);
});

test("missing posting date stays null instead of pretending to be today", async () => {
  mockFetch(() => Response.json(g2bPayload([g2bRow({ ntceDt: "" })])));
  const r = await call("/api/g2b");
  assert.equal(r.body.items[0].start, null);
});

test("timeout / network error → 502", async () => {
  mockFetch(() => { throw new DOMException("timeout", "TimeoutError"); });
  const r = await call("/api/g2b");
  assert.equal(r.status, 502); assert.equal(r.body.ok, false);
});

test("Bizinfo: closed notices dropped, no-deadline kept", async () => {
  mockFetch(() => Response.json({ jsonArray: [
    { seq: "1", title: "콘텐츠 기업 지원", reqstBeginEndDe: `20260101 ~ ${kstDate(3).replaceAll("-", "")}` },
    { seq: "2", title: "지난 공고", reqstBeginEndDe: "20200101 ~ 20200201" },
    { seq: "3", title: "상시 모집", reqstBeginEndDe: "상시" },
  ] }));
  const r = await call("/api/bizinfo/support");
  assert.deepEqual(r.body.items.map((i) => i.id), ["bizinfo-1", "bizinfo-3"]);
  assert.equal(r.body.items[1].deadline, null);
});

test("Bizinfo 200 with HTML block page is a failure", async () => {
  mockFetch(() => new Response("<!DOCTYPE html><html>Access Denied</html>", { status: 200 }));
  const r = await call("/api/bizinfo/events");
  assert.equal(r.body.ok, false);
});

test("custom source rejects non-.go.kr hosts (SSRF guard)", async () => {
  const r = await worker.fetch(new Request("https://radar.test/api/custom-source", { method: "POST", body: JSON.stringify({ name: "x", url: "https://169.254.169.254/latest" }) }), ENV);
  assert.equal(r.status, 400);
});
