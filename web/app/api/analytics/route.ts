import { NextRequest, NextResponse } from "next/server";

const ZERNIO_BASE = "https://zernio.com/api/v1";

async function zernio(path: string, token: string) {
  const res = await fetch(`${ZERNIO_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zernio ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const token = process.env.ZERNIO_API_KEY;
  if (!token) return NextResponse.json({ error: "ZERNIO_API_KEY not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const dateSuffix = `&fromDate=${fmt(fromDate)}&toDate=${fmt(toDate)}`;

  try {
    // Fetch connected accounts first to get accountIds
    const accountsRes = await zernio("/accounts", token);
    const accounts: { _id: string; platform: string; username?: string; name?: string }[] =
      accountsRes?.data ?? accountsRes ?? [];

    const tiktokAccount = accounts.find((a) => a.platform?.toLowerCase() === "tiktok");
    const igAccount = accounts.find(
      (a) => a.platform?.toLowerCase() === "instagram" || a.platform?.toLowerCase() === "instagram_business"
    );

    const [tiktok, instagram, daily] = await Promise.allSettled([
      tiktokAccount
        ? zernio(`/analytics/tiktok/account-insights?accountId=${tiktokAccount._id}${dateSuffix}`, token)
        : Promise.reject(new Error("No TikTok account connected")),
      igAccount
        ? zernio(`/analytics/instagram/account-insights?accountId=${igAccount._id}${dateSuffix}`, token)
        : Promise.reject(new Error("No Instagram account connected")),
      zernio(`/analytics/daily-metrics?${dateSuffix.slice(1)}`, token),
    ]);

    return NextResponse.json({
      tiktok: tiktok.status === "fulfilled" ? tiktok.value : null,
      instagram: instagram.status === "fulfilled" ? instagram.value : null,
      daily: daily.status === "fulfilled" ? daily.value : null,
      accounts: accounts.map((a) => ({ id: a._id, platform: a.platform, name: a.username ?? a.name })),
      errors: {
        tiktok: tiktok.status === "rejected" ? (tiktok.reason as Error)?.message : null,
        instagram: instagram.status === "rejected" ? (instagram.reason as Error)?.message : null,
        daily: daily.status === "rejected" ? (daily.reason as Error)?.message : null,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
