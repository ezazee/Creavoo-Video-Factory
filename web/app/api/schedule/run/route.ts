import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}` ?? "http://localhost:3000";
  const qs = req.nextUrl.search;
  const res = await fetch(`${base}/api/schedule/tick${qs}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
