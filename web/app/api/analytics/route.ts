import { NextRequest, NextResponse } from "next/server";

const ZERNIO_BASE = "https://zernio.com/api/v1";

export async function GET(req: NextRequest) {
  const token = process.env.ZERNIO_API_KEY;
  if (!token) return NextResponse.json({ error: "ZERNIO_API_KEY not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  try {
    const res = await fetch(
      `${ZERNIO_BASE}/analytics?fromDate=${fmt(fromDate)}&toDate=${fmt(toDate)}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`Zernio /analytics → ${res.status}`);
    const d = await res.json();

    type ZPost = { platform: string; publishedAt: string; analytics: Record<string, number> };
    type ZAccount = { platform: string; followersCount?: number };
    const posts: ZPost[] = d.posts ?? [];
    const accounts: ZAccount[] = d.accounts ?? [];

    function agg(platform: string) {
      const pp = posts.filter((p) => p.platform?.toLowerCase() === platform);
      if (pp.length === 0) return null;
      const totals = pp.reduce(
        (acc, p) => {
          const a = p.analytics ?? {};
          acc.impressions += a.impressions ?? 0;
          acc.reach += a.reach ?? 0;
          acc.likes += a.likes ?? 0;
          acc.comments += a.comments ?? 0;
          acc.shares += a.shares ?? 0;
          acc.views += a.views ?? 0;
          acc.engRateSum += a.engagementRate ?? 0;
          return acc;
        },
        { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, views: 0, engRateSum: 0 }
      );
      const account = accounts.find((a) => a.platform?.toLowerCase() === platform);
      return {
        posts: pp.length,
        impressions: totals.impressions,
        reach: totals.reach,
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares,
        views: totals.views,
        followers: account?.followersCount ?? 0,
        engagement_rate: totals.engRateSum / pp.length,
      };
    }

    // Group posts by publish date for the trend chart
    const dailyMap: Record<string, { views: number; likes: number; posts: number }> = {};
    for (const p of posts) {
      const date = p.publishedAt?.split("T")[0];
      if (!date) continue;
      if (!dailyMap[date]) dailyMap[date] = { views: 0, likes: 0, posts: 0 };
      dailyMap[date].views += p.analytics?.views ?? 0;
      dailyMap[date].likes += p.analytics?.likes ?? 0;
      dailyMap[date].posts += 1;
    }
    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const recentPosts = posts
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20)
      .map((p) => ({
        platform: p.platform,
        content: (p as Record<string, unknown>).content as string ?? "",
        publishedAt: p.publishedAt,
        thumbnailUrl: (p as Record<string, unknown>).thumbnailUrl as string ?? null,
        platformPostUrl: (p as Record<string, unknown>).platformPostUrl as string ?? null,
        likes: p.analytics?.likes ?? 0,
        views: p.analytics?.views ?? 0,
        reach: p.analytics?.reach ?? 0,
        engagementRate: p.analytics?.engagementRate ?? 0,
      }));

    return NextResponse.json({
      tiktok: agg("tiktok"),
      instagram: agg("instagram"),
      daily,
      recentPosts,
      errors: { tiktok: null, instagram: null, daily: null },
    });
  } catch (e) {
    console.error("[analytics]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
