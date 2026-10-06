import worker from "../worker/index.js";

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  const request = new Request(url, { method: req.method || "GET" });
  const response = await worker.fetch(request, process.env);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}
