import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { loadJob, saveJob, type ScheduleJob } from "../route";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export async function POST(req: NextRequest) {
  // Verify secret dari GitHub Actions
  const secret = req.headers.get("x-schedule-secret");
  const expectedSecret = process.env.SCHEDULE_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await req.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const job = await loadJob(Number(runId));
  if (!job) {
    // Bukan scheduled job, tidak apa-apa
    return NextResponse.json({ ok: true, skipped: "not a scheduled job" });
  }

  // Ambil video URL dari Blob
  const { blobs: videoBlobs } = await list({ prefix: `video-${runId}`, token: TOKEN });
  const { blobs: thumbBlobs } = await list({ prefix: `thumbnail-${runId}`, token: TOKEN });
  const videoUrl = videoBlobs[0]?.url;
  const thumbnailUrl = thumbBlobs[0]?.url ?? undefined;

  if (!videoUrl) {
    return NextResponse.json({ error: "video blob not found" }, { status: 404 });
  }

  let updated: ScheduleJob = { ...job, status: "done", videoUrl, thumbnailUrl };

  const captionFull = job.caption
    ? job.caption + (job.hashtags?.length ? "\n\n" + job.hashtags.map(h => `#${h}`).join(" ") : "")
    : "";

  // Auto-post
  const zernioKey = process.env.ZERNIO_API_KEY;
  if (zernioKey) {
    if (job.autoTikTok && !job.tiktokUrl) {
      try {
        const res = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: { Authorization: `Bearer ${zernioKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            content: captionFull,
            mediaItems: [{ url: videoUrl, type: "video" }],
            platforms: [{ platform: "tiktok", accountId: await getTiktokAccountId(zernioKey) }],
            publishNow: true,
            tiktokSettings: {
              privacy_level: "PUBLIC_TO_EVERYONE",
              allow_comment: true,
              video_cover_timestamp_ms: 3000,
              ...(thumbnailUrl ? { video_cover_image_url: thumbnailUrl } : {}),
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
        const res = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: { Authorization: `Bearer ${zernioKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            content: captionFull,
            mediaItems: [{ url: videoUrl, type: "video" }],
            platforms: [{
              platform: "instagram",
              accountId: await getIgAccountId(zernioKey),
              platformSpecificData: {
                contentType: "reels",
                shareToFeed: job.igShareToFeed,
                ...(thumbnailUrl ? { instagramThumbnail: thumbnailUrl } : { thumbOffset: 3000 }),
              },
            }],
            publishNow: true,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          updated = { ...updated, instagramUrl: d.postUrl ?? "posted", status: "posted" };
        }
      } catch { /* non-blocking */ }
    }
  }

  await saveJob(updated);
  return NextResponse.json({ ok: true, status: updated.status });
}

async function getAccounts(token: string) {
  const res = await fetch("https://zernio.com/api/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const d = await res.json();
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
}

async function getTiktokAccountId(token: string): Promise<string> {
  const accounts = await getAccounts(token);
  return accounts.find((a: { platform: string; _id: string }) => a.platform?.toLowerCase() === "tiktok")?._id ?? "";
}

async function getIgAccountId(token: string): Promise<string> {
  const accounts = await getAccounts(token);
  return accounts.find((a: { platform: string; _id: string }) =>
    a.platform?.toLowerCase().includes("instagram")
  )?._id ?? "";
}
