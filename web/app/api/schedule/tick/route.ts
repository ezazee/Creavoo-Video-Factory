import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { loadSettings, loadRecentJobs, saveJob, getDayConfig, type ScheduleJob } from "../route";

export const maxDuration = 60;

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

// Panggil internal API routes dari dalam server-side
async function callInternal(path: string, method = "GET", body?: unknown) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function checkGithubRun(runId: number): Promise<{ status: string; conclusion: string | null }> {
  const [owner, repo] = GITHUB_REPO.split("/");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  const d = await res.json();
  return { status: d.status, conclusion: d.conclusion };
}

// Cek rendering jobs yang sudah selesai → auto-post
async function processPendingJobs() {
  const jobs = await loadRecentJobs(20);
  const rendering = jobs.filter(j => j.status === "rendering");
  const log: string[] = [];

  for (const job of rendering) {
    try {
      const run = await checkGithubRun(job.runId);
      if (run.status !== "completed") continue;

      if (run.conclusion !== "success") {
        await saveJob({ ...job, status: "failed" });
        log.push(`job ${job.runId} → failed`);
        continue;
      }

      let updated: ScheduleJob;

      if (job.mediaType === "carousel") {
        // Ambil carousel slides dari Blob
        const { blobs: slideBlobs } = await list({ prefix: `carousel-${job.runId}-`, token: TOKEN });
        if (!slideBlobs.length) { log.push(`job ${job.runId} (carousel) → blob not ready yet`); continue; }
        const slides = slideBlobs
          .sort((a, b) => {
            const na = parseInt(a.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
            const nb = parseInt(b.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
            return na - nb;
          })
          .map(b => b.url);
        updated = { ...job, status: "done", imageUrls: slides };
      } else {
        // Ambil videoUrl dari Blob
        const { blobs: videoBlobs } = await list({ prefix: `video-${job.runId}`, token: TOKEN });
        const { blobs: thumbBlobs } = await list({ prefix: `thumbnail-${job.runId}`, token: TOKEN });
        const videoUrl = videoBlobs[0]?.url;
        const thumbnailUrl = thumbBlobs[0]?.url ?? undefined;
        if (!videoUrl) { log.push(`job ${job.runId} (video) → blob not ready yet`); continue; }
        updated = { ...job, status: "done", videoUrl, thumbnailUrl };
      }

      // Auto-post ke platform
      const captionFull = job.caption
        ? job.caption + (job.hashtags?.length ? "\n\n" + job.hashtags.map(h => `#${h}`).join(" ") : "")
        : "";

      if (job.mediaType !== "carousel" && job.autoTikTok && !job.tiktokUrl) {
        try {
          const r = await callInternal("/api/publish", "POST", {
            platform: "tiktok", videoUrl: updated.videoUrl, caption: captionFull,
            thumbnailUrl: updated.thumbnailUrl, igShareToFeed: job.igShareToFeed,
          });
          updated = { ...updated, tiktokUrl: r.postUrl ?? "posted", status: "posted" };
          log.push(`job ${job.runId} → posted TikTok`);
        } catch (e) { log.push(`job ${job.runId} TikTok error: ${e}`); }
      }

      if (job.autoInstagram && !job.instagramUrl) {
        try {
          const publishBody = job.mediaType === "carousel"
            ? { platform: "instagram", imageUrls: updated.imageUrls, caption: captionFull, mediaType: "carousel" }
            : { platform: "instagram", videoUrl: updated.videoUrl, caption: captionFull, thumbnailUrl: updated.thumbnailUrl, igShareToFeed: job.igShareToFeed };
          const r = await callInternal("/api/publish", "POST", publishBody);
          updated = { ...updated, instagramUrl: r.postUrl ?? "posted", status: "posted" };
          log.push(`job ${job.runId} → posted Instagram (${job.mediaType})`);
        } catch (e) { log.push(`job ${job.runId} Instagram error: ${e}`); }
      }

      if (!job.autoTikTok && !job.autoInstagram) updated.status = "done";
      await saveJob(updated);
    } catch (e) {
      log.push(`job ${job.runId} error: ${e}`);
    }
  }

  return log;
}

export async function GET(req: NextRequest) {
  // Vercel Cron verification
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";
  const dryrun = req.nextUrl.searchParams.get("dryrun") === "true";
  const log: string[] = [];

  // Step 1: proses rendering jobs yang sudah selesai
  const pendingLog = await processPendingJobs();
  log.push(...pendingLog);

  // Step 2: cek apakah sekarang waktunya generate video baru
  const settings = await loadSettings();

  // Waktu WIB = UTC+7 (dipakai baik di time-check maupun force mode)
  const nowTs = new Date();
  const wibHour = (nowTs.getUTCHours() + 7) % 24;
  const wibDay = new Date(nowTs.getTime() + 7 * 3600 * 1000).getUTCDay();
  const dayConfig = getDayConfig(settings, wibDay);

  const isVideoTime = dayConfig.times.includes(wibHour);
  const isCarouselTime = (dayConfig.carouselTimes ?? []).includes(wibHour);

  if (!force) {
    if (!settings.enabled) {
      return NextResponse.json({ skipped: "schedule disabled", log });
    }
    if (!settings.days.includes(wibDay)) {
      return NextResponse.json({ skipped: `not scheduled on day ${wibDay}`, log });
    }
    if (!isVideoTime && !isCarouselTime) {
      return NextResponse.json({ skipped: `not scheduled at hour ${wibHour} WIB`, log });
    }
    log.push(`triggered at ${wibHour}:00 WIB day=${wibDay} — video=${isVideoTime} carousel=${isCarouselTime}`);
  } else {
    log.push(`⚡ force mode — hari=${wibDay} jam=${wibHour}:00 WIB${dryrun ? " · DRY RUN" : ""}`);
  }

  const KNOWLEDGE_OFF_TOPICS = [
    "Cara naik follower tanpa iklan di TikTok", "Strategi engagement yang bikin algoritma suka", "Kesalahan yang bikin akun Instagram susah berkembang",
    "Tips UMKM jualan di era digital", "Cara bangun brand yang diingat orang", "Strategi customer service yang bikin pelanggan loyal",
    "Cara kerja algoritma FYP TikTok", "Tips konten Instagram masuk Explore page", "Strategi YouTube Shorts agar direkomendasikan",
    "Cara dapat uang dari konten tanpa jutaan follower", "Strategi affiliate marketing yang benar-benar convert", "Tips dapat endorse pertama sebagai kreator kecil",
    "Kenapa orang stop scrolling di konten tertentu", "Formula caption yang bikin orang komen dan share", "Cara bikin hook video yang powerful di 3 detik",
    "Cara batch content 1 minggu hanya dalam 2 jam", "Tools gratis terbaik untuk kreator konten Indonesia", "Tips riset konten yang efisien",
    "Cara membangun otoritas di niche tertentu", "Pentingnya konsistensi visual dan voice di sosmed", "Tips dapat kolaborasi lewat personal brand",
    "Cara rekam video dengan HP tanpa kamera mahal", "Tips lighting konten di rumah modal nol", "Aplikasi edit video terbaik di HP gratis",
  ];

  const pickTopic = (trendTopics: string[]) => {
    if (dayConfig.useKnowledge) {
      return trendTopics[Math.floor(Math.random() * Math.min(trendTopics.length, 3))] ?? "Tips viral sosmed 2026";
    }
    const pool = trendTopics.length > 0 ? [...trendTopics.slice(0, 3), ...KNOWLEDGE_OFF_TOPICS] : KNOWLEDGE_OFF_TOPICS;
    return pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
  };

  const results: { type: string; runId?: number; videoTitle?: string }[] = [];

  // ── VIDEO ──────────────────────────────────────────────────────────────────
  if (isVideoTime || force) {
    try {
      const trendsData = await callInternal("/api/trends").catch(() => ({ topics: [] }));
      const topic = pickTopic(trendsData.topics ?? []);
      log.push(`[VIDEO] topic: "${topic}"`);

      const script = await callInternal("/api/generate", "POST", { topic, useKnowledge: dayConfig.useKnowledge });
      log.push(`[VIDEO] ✓ script: "${script.videoTitle}"`);

      if (dryrun) {
        log.push("[VIDEO] DRY RUN — render dilewati");
      } else {
        const renderRes = await callInternal("/api/render", "POST", {
          ...script, voice: dayConfig.voice, watermarkHandle: "", watermarkLogoUrl: null,
        });
        const runId: number = renderRes.runId;
        log.push(`[VIDEO] render triggered runId=${runId}`);
        await saveJob({
          runId, createdAt: new Date().toISOString(), status: "rendering", mediaType: "video",
          videoTitle: script.videoTitle, caption: script.caption, hashtags: script.hashtags,
          autoTikTok: settings.autoTikTok, autoInstagram: settings.autoInstagram, igShareToFeed: dayConfig.igShareToFeed,
        });
        results.push({ type: "video", runId, videoTitle: script.videoTitle });
      }
    } catch (e) { log.push(`[VIDEO] error: ${e}`); }
  }

  // ── CAROUSEL ───────────────────────────────────────────────────────────────
  if (isCarouselTime || (force && (dayConfig.carouselTimes ?? []).length > 0)) {
    try {
      const trendsData = await callInternal("/api/trends").catch(() => ({ topics: [] }));
      const topic = pickTopic(trendsData.topics ?? []);
      log.push(`[CAROUSEL] topic: "${topic}"`);

      const script = await callInternal("/api/generate", "POST", { topic, useKnowledge: dayConfig.useKnowledge });
      log.push(`[CAROUSEL] ✓ script: "${script.videoTitle}"`);

      if (dryrun) {
        log.push("[CAROUSEL] DRY RUN — render dilewati");
      } else {
        const totalSlides = (script.tips?.length ?? 5) + 2;
        const renderRes = await callInternal("/api/render-image", "POST", {
          ...script, type: "carousel", totalSlides, watermarkHandle: "", watermarkLogoUrl: null,
        });
        const runId: number = renderRes.runId;
        log.push(`[CAROUSEL] render triggered runId=${runId}`);
        await saveJob({
          runId, createdAt: new Date().toISOString(), status: "rendering", mediaType: "carousel",
          videoTitle: script.videoTitle, caption: script.caption, hashtags: script.hashtags,
          autoTikTok: false, autoInstagram: settings.autoInstagram, igShareToFeed: true,
        });
        results.push({ type: "carousel", runId, videoTitle: script.videoTitle });
      }
    } catch (e) { log.push(`[CAROUSEL] error: ${e}`); }
  }

  if (dryrun) {
    log.push("✓ DRY RUN selesai — semua sistem OK");
    return NextResponse.json({ ok: true, dryrun: true, log });
  }

  return NextResponse.json({ ok: true, results, log });
}
