import { NextRequest, NextResponse } from "next/server";

const ZERNIO_BASE = "https://zernio.com/api/v1";

type Account = { _id: string; platform: string; username?: string; name?: string };

async function getAccounts(token: string): Promise<Account[]> {
  const res = await fetch(`${ZERNIO_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`accounts ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.accounts) ? d.accounts : [];
}

export async function POST(req: NextRequest) {
  const token = process.env.ZERNIO_API_KEY;
  if (!token) return NextResponse.json({ error: "ZERNIO_API_KEY not set" }, { status: 500 });

  const { platform, videoUrl, caption, thumbnailUrl, igShareToFeed = true } = await req.json();
  if (!platform || !videoUrl) {
    return NextResponse.json({ error: "platform & videoUrl required" }, { status: 400 });
  }

  try {
    const accounts = await getAccounts(token);
    const account = accounts.find((a) => {
      const p = a.platform?.toLowerCase();
      return platform === "tiktok" ? p === "tiktok"
        : p === "instagram" || p === "instagram_business";
    });

    if (!account) {
      return NextResponse.json({ error: `Tidak ada akun ${platform} yang terhubung di Zernio` }, { status: 400 });
    }

    // Platform-specific options:
    // Instagram → contentType:"reels" + instagramThumbnail (supaya masuk tab Reels bukan grid biasa)
    // TikTok    → tiktokSettings.video_cover_image_url untuk thumbnail
    const platformEntry =
      platform === "instagram"
        ? {
            platform,
            accountId: account._id,
            platformSpecificData: {
              contentType: "reels",
              shareToFeed: igShareToFeed,
              // thumbOffset 3000ms = detik 3, konten sudah visible (bukan fade-in gelap)
              ...(thumbnailUrl ? { instagramThumbnail: thumbnailUrl } : { thumbOffset: 3000 }),
            },
          }
        : { platform, accountId: account._id };

    const body: Record<string, unknown> = {
      content: caption ?? "",
      mediaItems: [{ url: videoUrl, type: "video" }],
      platforms: [platformEntry],
      publishNow: true,
    };

    if (platform === "tiktok") {
      body.tiktokSettings = {
        privacy_level: "PUBLIC_TO_EVERYONE",
        allow_comment: true,
        allow_duet: true,
        allow_stitch: true,
        content_preview_confirmed: true,
        express_consent_given: true,
        // video_cover_timestamp_ms: pilih frame detik 3 (3000ms) — konten intro sudah visible
        // video_cover_image_url: sebagai fallback kalau Zernio support external URL
        video_cover_timestamp_ms: 3000,
        ...(thumbnailUrl ? { video_cover_image_url: thumbnailUrl } : {}),
      };
    }

    const res = await fetch(`${ZERNIO_BASE}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: `Zernio ${res.status}: ${text}` }, { status: 502 });

    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { /* non-json ok */ }

    // Cari link post — respons immediate punya platformPostUrl (bisa nested di platforms[])
    const platformsArr = (data.platforms ?? data.results) as Array<Record<string, unknown>> | undefined;
    const postUrl =
      (data.platformPostUrl
        ?? data.postUrl
        ?? data.url
        ?? platformsArr?.[0]?.platformPostUrl
        ?? platformsArr?.[0]?.url) as string | undefined;

    return NextResponse.json({ ok: true, postUrl: postUrl ?? null, account: account.username ?? account.name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
