import { NextResponse } from "next/server";

const ZERNIO_BASE = "https://zernio.com/api/v1";

async function tryEndpoint(path: string, token: string) {
  try {
    const res = await fetch(`${ZERNIO_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { path, status: res.status, ok: res.ok, data: json ?? text };
  } catch (e) {
    return { path, status: 0, ok: false, data: String(e) };
  }
}

export async function GET() {
  const token = process.env.ZERNIO_API_KEY;
  if (!token) return NextResponse.json({ error: "ZERNIO_API_KEY not set" }, { status: 500 });

  const today = new Date().toISOString().split("T")[0];
  const from30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const results = await Promise.all([
    tryEndpoint("/accounts", token),
    tryEndpoint("/analytics", token),
    tryEndpoint(`/analytics?fromDate=${from30}&toDate=${today}`, token),
    tryEndpoint("/analytics/overview", token),
    tryEndpoint(`/analytics/daily-metrics?fromDate=${from30}&toDate=${today}`, token),
    tryEndpoint("/posts?limit=5", token),
    tryEndpoint(`/posts?fromDate=${from30}&toDate=${today}&limit=5`, token),
    tryEndpoint("/analytics/summary", token),
  ]);

  return NextResponse.json(results, { status: 200 });
}
