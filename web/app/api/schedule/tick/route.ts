import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { loadSettings, loadRecentJobs, saveJob, loadJob } from "../route";

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

      // Ambil videoUrl dari Blob
      const { blobs: videoBlobs } = await list({ prefix: `video-${job.runId}`, token: TOKEN });
      const { blobs: thumbBlobs } = await list({ prefix: `thumbnail-${job.runId}`, token: TOKEN });
      const videoUrl = videoBlobs[0]?.url;
      const thumbnailUrl = thumbBlobs[0]?.url ?? undefined;

      if (!videoUrl) { log.push(`job ${job.runId} → blob not ready yet`); continue; }

      let updated = { ...job, status: "done" as const, videoUrl, thumbnailUrl };

      // Auto-post ke platform
      const captionFull = job.caption
        ? job.caption + (job.hashtags?.length ? "\n\n" + job.hashtags.map(h => `#${h}`).join(" ") : "")
        : "";

      if (job.autoTikTok && !job.tiktokUrl) {
        try {
          const r = await callInternal("/api/publish", "POST", {
            platform: "tiktok", videoUrl, caption: captionFull, thumbnailUrl, igShareToFeed: job.igShareToFeed,
          });
          updated = { ...updated, tiktokUrl: r.postUrl ?? "posted", status: "posted" };
          log.push(`job ${job.runId} → posted TikTok`);
        } catch (e) { log.push(`job ${job.runId} TikTok error: ${e}`); }
      }

      if (job.autoInstagram && !job.instagramUrl) {
        try {
          const r = await callInternal("/api/publish", "POST", {
            platform: "instagram", videoUrl, caption: captionFull, thumbnailUrl, igShareToFeed: job.igShareToFeed,
          });
          updated = { ...updated, instagramUrl: r.postUrl ?? "posted", status: "posted" };
          log.push(`job ${job.runId} → posted Instagram`);
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

  const log: string[] = [];

  // Step 1: proses rendering jobs yang sudah selesai
  const pendingLog = await processPendingJobs();
  log.push(...pendingLog);

  // Step 2: cek apakah sekarang waktunya generate video baru
  const settings = await loadSettings();
  if (!settings.enabled) {
    return NextResponse.json({ skipped: "schedule disabled", log });
  }

  // Waktu WIB = UTC+7
  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;
  const wibDay = new Date(now.getTime() + 7 * 3600 * 1000).getUTCDay();

  if (!settings.days.includes(wibDay)) {
    return NextResponse.json({ skipped: `not scheduled on day ${wibDay}`, log });
  }
  if (!settings.times.includes(wibHour)) {
    return NextResponse.json({ skipped: `not scheduled at hour ${wibHour} WIB`, log });
  }

  log.push(`triggered at ${wibHour}:00 WIB day=${wibDay}`);

  try {
    // Ambil topik dari trending
    const trendsData = await callInternal("/api/trends");
    const topics: string[] = trendsData.topics ?? [];
    const topic = topics[Math.floor(Math.random() * Math.min(topics.length, 3))] ?? "Tips viral TikTok 2026";
    log.push(`topic: ${topic}`);

    // Generate script
    const script = await callInternal("/api/generate", "POST", {
      topic,
      useKnowledge: settings.useKnowledge,
    });
    log.push(`generated: ${script.videoTitle}`);

    // Trigger render
    const renderRes = await callInternal("/api/render", "POST", {
      ...script,
      voice: settings.voice,
      watermarkHandle: "",
      watermarkLogoUrl: null,
    });
    const runId: number = renderRes.runId;
    log.push(`render triggered runId=${runId}`);

    // Simpan job ke Blob
    await saveJob({
      runId,
      createdAt: new Date().toISOString(),
      status: "rendering",
      videoTitle: script.videoTitle,
      caption: script.caption,
      hashtags: script.hashtags,
      autoTikTok: settings.autoTikTok,
      autoInstagram: settings.autoInstagram,
      igShareToFeed: settings.igShareToFeed,
    });

    return NextResponse.json({ ok: true, runId, topic, videoTitle: script.videoTitle, log });
  } catch (e) {
    log.push(`error: ${e}`);
    return NextResponse.json({ error: String(e), log }, { status: 500 });
  }
}
