import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { loadJob, saveJob, type ScheduleJob } from "../route";
import { sendTelegram } from "@/lib/telegram";

export const maxDuration = 60;

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-schedule-secret");
  const expectedSecret = process.env.SCHEDULE_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await req.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const job = await loadJob(Number(runId));
  if (!job) {
    return NextResponse.json({ ok: true, skipped: "not a scheduled job" });
  }

  let updated: ScheduleJob;

  if (job.mediaType === "carousel") {
    const { blobs: slideBlobs } = await list({ prefix: `carousel-${runId}-`, token: TOKEN });
    if (!slideBlobs.length) {
      return NextResponse.json({ error: "carousel blobs not found" }, { status: 404 });
    }
    const slides = slideBlobs
      .sort((a, b) => {
        const na = parseInt(a.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        const nb = parseInt(b.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        return na - nb;
      })
      .map(b => b.url);
    updated = { ...job, status: "done", imageUrls: slides };
  } else {
    const { blobs: videoBlobs } = await list({ prefix: `video-${runId}`, token: TOKEN });
    const { blobs: thumbBlobs } = await list({ prefix: `thumbnail-${runId}`, token: TOKEN });
    const videoUrl = videoBlobs[0]?.url;
    const thumbnailUrl = thumbBlobs[0]?.url ?? undefined;
    if (!videoUrl) {
      return NextResponse.json({ error: "video blob not found" }, { status: 404 });
    }
    updated = { ...job, status: "done", videoUrl, thumbnailUrl };
  }

  const captionFull = job.caption
    ? job.caption + (job.hashtags?.length ? "\n\n" + job.hashtags.map(h => `#${h}`).join(" ") : "")
    : "";

  const jobProfile = job.profile ?? "creavoo";
  const zernioKey = jobProfile === "zaportfolio"
    ? process.env.ZERNIO_API_KEY_ZAPORTFOLIO
    : (process.env.ZERNIO_API_KEY_CREAVOO ?? process.env.ZERNIO_API_KEY);
  if (zernioKey) {
    const accounts = await getAccounts(zernioKey);

    if (job.mediaType !== "carousel" && job.autoTikTok && !job.tiktokUrl) {
      try {
        const accountId = accounts.find((a: { platform: string }) => a.platform?.toLowerCase() === "tiktok")?._id ?? "";
        const res = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: { Authorization: `Bearer ${zernioKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            content: captionFull,
            mediaItems: [{ url: updated.videoUrl, type: "video" }],
            platforms: [{ platform: "tiktok", accountId }],
            publishNow: true,
            tiktokSettings: {
              privacy_level: "PUBLIC_TO_EVERYONE",
              allow_comment: true,
              video_cover_timestamp_ms: 3000,
              ...(updated.thumbnailUrl ? { video_cover_image_url: updated.thumbnailUrl } : {}),
            },
          }),
        });
        if (res.ok) {
          const d = await res.json();
          updated = { ...updated, tiktokUrl: d.postUrl ?? "posted", status: "posted" };
        }
      } catch { /* non-blocking */ }
    }

    if (job.autoInstagram && !job.instagramUrl) {
      try {
        const igAccount = accounts.find((a: { platform: string }) =>
          a.platform?.toLowerCase().includes("instagram")
        );
        const accountId = igAccount?._id ?? "";

        let mediaItems: { url: string; type: string; order?: number }[];
        let platformSpecificData: Record<string, unknown>;

        if (job.mediaType === "carousel" && updated.imageUrls?.length) {
          mediaItems = updated.imageUrls.map((url, i) => ({ url, type: "image", order: i }));
          platformSpecificData = { contentType: "carousel", shareToFeed: true };
        } else {
          mediaItems = [{ url: updated.videoUrl!, type: "video" }];
          platformSpecificData = {
            contentType: "reels",
            shareToFeed: job.igShareToFeed,
            ...(updated.thumbnailUrl ? { instagramThumbnail: updated.thumbnailUrl } : { thumbOffset: 3000 }),
          };
        }

        const res = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: { Authorization: `Bearer ${zernioKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            content: captionFull,
            mediaItems,
            platforms: [{ platform: "instagram", accountId, platformSpecificData }],
            publishNow: true,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          updated = { ...updated, instagramUrl: d.postUrl ?? "posted", status: "posted" };
        } else {
          const errText = await res.text();
          await sendTelegram(
            `❌ <b>Gagal post ke Instagram</b>\n` +
            `📌 <i>${job.videoTitle}</i>\n` +
            `🗂 ${job.mediaType} · runId ${job.runId}\n` +
            `⚠️ Error: Zernio ${res.status} — ${errText.slice(0, 200)}`
          );
        }
      } catch (e) {
        await sendTelegram(
          `❌ <b>Gagal post ke Instagram</b>\n` +
          `📌 <i>${job.videoTitle}</i>\n` +
          `🗂 ${job.mediaType} · runId ${job.runId}\n` +
          `⚠️ Error: ${String(e).slice(0, 200)}`
        );
      }
    }
  }

  await saveJob(updated);

  // ── Telegram notifications ──────────────────────────────────────────────────
  const typeLabel = job.mediaType === "carousel" ? "🎠 Carousel" : "🎬 Reels";
  if (updated.status === "posted") {
    const igUrl = updated.instagramUrl && updated.instagramUrl !== "posted" ? `\n🔗 ${updated.instagramUrl}` : "";
    await sendTelegram(
      `✅ <b>Berhasil diposting!</b>\n` +
      `📌 <i>${job.videoTitle}</i>\n` +
      `${typeLabel}${igUrl}`
    );
  } else if (updated.status === "done") {
    await sendTelegram(
      `⚠️ <b>Render selesai, tapi belum diposting</b>\n` +
      `📌 <i>${job.videoTitle}</i>\n` +
      `${typeLabel} · Auto-post tidak aktif atau tidak ada akun terhubung`
    );
  }

  return NextResponse.json({ ok: true, status: updated.status, mediaType: job.mediaType });
}

async function getAccounts(token: string) {
  const res = await fetch("https://zernio.com/api/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const d = await res.json();
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
}
