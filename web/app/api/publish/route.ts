import { NextRequest, NextResponse } from "next/server";
import { getZernioKey } from "@/lib/config";

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
  const body = await req.json();
  const { profile } = body;
  const token = await getZernioKey(profile ?? "creavoo");
  if (!token) return NextResponse.json({ error: "API key Zernio belum di-set untuk profile ini (cek Settings)" }, { status: 500 });

  const {
    platform,
    // video
    videoUrl,
    thumbnailUrl,
    igShareToFeed = true,
    // image / carousel
    imageUrl,
    imageUrls,   // string[] — carousel slides in order
    mediaType,   // "video" | "image" | "carousel"
    caption,
  } = body;

  const resolvedMediaType: "video" | "image" | "carousel" =
    mediaType ?? (videoUrl ? "video" : imageUrls?.length > 1 ? "carousel" : "image");

  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
  if (resolvedMediaType === "video" && !videoUrl)
    return NextResponse.json({ error: "videoUrl required for video" }, { status: 400 });
  if (resolvedMediaType === "image" && !imageUrl)
    return NextResponse.json({ error: "imageUrl required for image" }, { status: 400 });
  if (resolvedMediaType === "carousel" && (!imageUrls || imageUrls.length < 2))
    return NextResponse.json({ error: "imageUrls (min 2) required for carousel" }, { status: 400 });

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

    // ── Build mediaItems ────────────────────────────────────────────────────────
    let mediaItems: { url: string; type: string; order?: number }[];

    if (resolvedMediaType === "video") {
      mediaItems = [{ url: videoUrl, type: "video" }];
    } else if (resolvedMediaType === "carousel") {
      // Urutan dijaga lewat field `order` + array order
      mediaItems = (imageUrls as string[]).map((url, i) => ({ url, type: "image", order: i }));
    } else {
      mediaItems = [{ url: imageUrl, type: "image" }];
    }

    // ── Build platform entry ────────────────────────────────────────────────────
    let platformSpecificData: Record<string, unknown> = {};

    if (platform === "instagram") {
      if (resolvedMediaType === "video") {
        platformSpecificData = {
          contentType: "reels",
          shareToFeed: igShareToFeed,
          ...(thumbnailUrl ? { instagramThumbnail: thumbnailUrl } : { thumbOffset: 3000 }),
        };
      } else if (resolvedMediaType === "carousel") {
        platformSpecificData = { contentType: "carousel", shareToFeed: true };
      } else {
        platformSpecificData = { contentType: "feed", shareToFeed: true };
      }
    }

    const platformEntry =
      platform === "tiktok"
        ? { platform, accountId: account._id }
        : { platform, accountId: account._id, platformSpecificData };

    const postBody: Record<string, unknown> = {
      content: caption ?? "",
      mediaItems,
      platforms: [platformEntry],
      publishNow: true,
    };

    if (platform === "tiktok" && resolvedMediaType === "video") {
      postBody.tiktokSettings = {
        privacy_level: "PUBLIC_TO_EVERYONE",
        allow_comment: true,
        allow_duet: true,
        allow_stitch: true,
        content_preview_confirmed: true,
        express_consent_given: true,
        video_cover_timestamp_ms: 3000,
        ...(thumbnailUrl ? { video_cover_image_url: thumbnailUrl } : {}),
      };
    }

    const res = await fetch(`${ZERNIO_BASE}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(postBody),
    });

    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: `Zernio ${res.status}: ${text}` }, { status: 502 });

    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { /* non-json ok */ }

    const platformsArr = (data.platforms ?? data.results) as Array<Record<string, unknown>> | undefined;
    const postUrl =
      (data.platformPostUrl ?? data.postUrl ?? data.url
        ?? platformsArr?.[0]?.platformPostUrl ?? platformsArr?.[0]?.url) as string | undefined;

    return NextResponse.json({ ok: true, postUrl: postUrl ?? null, account: account.username ?? account.name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
