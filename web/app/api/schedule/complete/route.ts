import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { loadJob, saveJob, type ScheduleJob } from "../route";
import { sendTelegram } from "@/lib/telegram";

export const maxDuration = 60;

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

// Panggil /api/publish internal — satu jalur publish untuk manual & scheduled
async function publishInternal(body: Record<string, unknown>): Promise<{ postUrl?: string }> {
  const base = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${base}/api/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Lolos middleware auth untuk panggilan server-to-server internal
      "x-internal-secret": process.env.SCHEDULE_WEBHOOK_SECRET ?? "",
    },
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok || d.error) throw new Error(d.error ?? `publish ${res.status}`);
  return d;
}

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
    return NextResponse.json({ ok: true, skipped: "no job record for this run" });
  }
  if (job.status === "posted") {
    return NextResponse.json({ ok: true, skipped: "already posted" });
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
    : job.videoTitle;

  const jobProfile = job.profile ?? "creavoo";
  const errors: string[] = [];

  // ── TikTok (video saja) — berlaku untuk SEMUA profile ──────────────────────
  if (job.mediaType !== "carousel" && job.autoTikTok && !job.tiktokUrl) {
    try {
      const r = await publishInternal({
        platform: "tiktok", videoUrl: updated.videoUrl, caption: captionFull,
        thumbnailUrl: updated.thumbnailUrl, profile: jobProfile,
      });
      updated = { ...updated, tiktokUrl: r.postUrl ?? "posted", status: "posted" };
    } catch (e) {
      errors.push(`TikTok: ${String(e instanceof Error ? e.message : e).slice(0, 200)}`);
    }
  }

  // ── Instagram (video reels / carousel) ──────────────────────────────────────
  if (job.autoInstagram && !job.instagramUrl) {
    try {
      const body = job.mediaType === "carousel"
        ? { platform: "instagram", imageUrls: updated.imageUrls, caption: captionFull, mediaType: "carousel", profile: jobProfile }
        : { platform: "instagram", videoUrl: updated.videoUrl, caption: captionFull, thumbnailUrl: updated.thumbnailUrl, igShareToFeed: job.igShareToFeed, profile: jobProfile };
      const r = await publishInternal(body);
      updated = { ...updated, instagramUrl: r.postUrl ?? "posted", status: "posted" };
    } catch (e) {
      errors.push(`Instagram: ${String(e instanceof Error ? e.message : e).slice(0, 200)}`);
    }
  }

  await saveJob(updated);

  // ── Notifikasi Telegram ──────────────────────────────────────────────────────
  const typeLabel = job.mediaType === "carousel" ? "🎠 Carousel" : "🎬 Video";
  const profileLabel = jobProfile === "zaportfolio" ? "Zaportfolio" : "Creavoo";

  if (errors.length) {
    await sendTelegram(
      `❌ <b>Gagal auto-post!</b>\n` +
      `📌 <i>${job.videoTitle}</i>\n` +
      `${typeLabel} · ${profileLabel} · runId ${job.runId}\n` +
      `⚠️ ${errors.join("\n⚠️ ")}`
    );
  }
  if (updated.status === "posted") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const platforms = [
      updated.tiktokUrl ? "TikTok" : "",
      updated.instagramUrl ? "Instagram" : "",
    ].filter(Boolean).join(" & ");
    const links = [
      updated.tiktokUrl && updated.tiktokUrl !== "posted" ? updated.tiktokUrl : "",
      updated.instagramUrl && updated.instagramUrl !== "posted" ? updated.instagramUrl : "",
    ].filter(Boolean).join("\n");
    await sendTelegram(
      `🔔 <b>Notif Post baru nih!</b>\n\n` +
      `title : ${job.videoTitle}\n` +
      `platform : ${platforms || typeLabel}\n` +
      `akun : ${jobProfile}\n` +
      `link : ${links || "-"}\n\n` +
      (appUrl ? `ini dari web : ${appUrl}/results/${job.runId}` : "")
    );
  } else if (updated.status === "done" && !errors.length) {
    if (job.autoTikTok || job.autoInstagram) {
      // auto flag aktif tapi tidak ada yang terposting (tanpa error eksplisit) — tetap kabari
      await sendTelegram(
        `⚠️ <b>Render selesai, belum terposting</b>\n` +
        `📌 <i>${job.videoTitle}</i>\n${typeLabel} · ${profileLabel}`
      );
    } else {
      await sendTelegram(
        `🎞 <b>Render selesai</b>\n` +
        `📌 <i>${job.videoTitle}</i>\n${typeLabel} · ${profileLabel} · auto-post off — cek di Results`
      );
    }
  }

  return NextResponse.json({ ok: true, status: updated.status, mediaType: job.mediaType, errors });
}
