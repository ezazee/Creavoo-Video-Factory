import { NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { loadRecentJobs, loadJob, type ScheduleJob } from "../schedule/route";

export const maxDuration = 30;

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export type ResultItem = {
  runId: number;
  title: string;
  mediaType: "video" | "carousel" | "image";
  profile: string;
  status: "rendering" | "done" | "failed" | "posted";
  createdAt: string;
  caption?: string;
  hashtags?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  tiktokUrl?: string;
  instagramUrl?: string;
  legacy?: boolean; // item lama tanpa job record — metadata terbatas
};

type BlobFile = { url: string; pathname: string; uploadedAt: Date | string };

// Lengkapi URL media dari Blob untuk job yang belum punya (webhook belum sempat isi)
function resolveMedia(job: ScheduleJob, videos: BlobFile[], thumbs: BlobFile[], slides: BlobFile[]): ResultItem {
  const item: ResultItem = {
    runId: job.runId,
    title: job.videoTitle,
    mediaType: job.mediaType === "carousel" ? "carousel" : "video",
    profile: job.profile ?? "creavoo",
    status: job.status,
    createdAt: job.createdAt,
    caption: job.caption,
    hashtags: job.hashtags,
    videoUrl: job.videoUrl,
    thumbnailUrl: job.thumbnailUrl,
    imageUrls: job.imageUrls,
    tiktokUrl: job.tiktokUrl,
    instagramUrl: job.instagramUrl,
  };

  if (item.mediaType === "video" && !item.videoUrl) {
    item.videoUrl = videos.find(v => v.pathname.includes(String(job.runId)))?.url;
    if (item.videoUrl && item.status === "rendering") item.status = "done";
  }
  if (!item.thumbnailUrl) {
    item.thumbnailUrl = thumbs.find(t => t.pathname.includes(String(job.runId)))?.url;
  }
  if (item.mediaType === "carousel" && (!item.imageUrls || !item.imageUrls.length)) {
    const mine = slides
      .filter(s => s.pathname.startsWith(`carousel-${job.runId}-`))
      .sort((a, b) => {
        const na = parseInt(a.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        const nb = parseInt(b.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        return na - nb;
      })
      .map(s => s.url);
    if (mine.length) {
      item.imageUrls = mine;
      if (item.status === "rendering") item.status = "done";
    }
  }
  return item;
}

async function listBlobs() {
  const [videos, thumbs, slides] = await Promise.all([
    list({ prefix: "video-", token: TOKEN }).then(r => r.blobs),
    list({ prefix: "thumbnail-", token: TOKEN }).then(r => r.blobs),
    list({ prefix: "carousel-", token: TOKEN }).then(r => r.blobs),
  ]);
  return { videos, thumbs, slides };
}

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "all";
  const runIdParam = req.nextUrl.searchParams.get("runId");

  const { videos, thumbs, slides } = await listBlobs();

  // ── Single item (detail page) ────────────────────────────────────────────────
  if (runIdParam) {
    const job = await loadJob(Number(runIdParam));
    if (job) return NextResponse.json({ item: resolveMedia(job, videos, thumbs, slides) });
    // Legacy: file blob tanpa job record
    const v = videos.find(x => x.pathname.includes(runIdParam));
    if (v) {
      return NextResponse.json({
        item: {
          runId: Number(runIdParam), title: `video ${runIdParam}`, mediaType: "video",
          profile: "creavoo", status: "done", createdAt: String(v.uploadedAt),
          videoUrl: v.url, thumbnailUrl: thumbs.find(t => t.pathname.includes(runIdParam))?.url,
          legacy: true,
        } satisfies ResultItem,
      });
    }
    const mySlides = slides.filter(s => s.pathname.startsWith(`carousel-${runIdParam}-`));
    if (mySlides.length) {
      return NextResponse.json({
        item: {
          runId: Number(runIdParam), title: "Post Carousel", mediaType: "carousel",
          profile: "creavoo", status: "done", createdAt: String(mySlides[0].uploadedAt),
          imageUrls: mySlides
            .sort((a, b) => parseInt(a.pathname.match(/slide-(\d+)/)?.[1] ?? "0") - parseInt(b.pathname.match(/slide-(\d+)/)?.[1] ?? "0"))
            .map(s => s.url),
          legacy: true,
        } satisfies ResultItem,
      });
    }
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  const profiles = profile === "all" ? ["creavoo", "zaportfolio"] : [profile];
  const jobLists = await Promise.all(profiles.map(p => loadRecentJobs(50, p)));
  const jobs = jobLists.flat();

  const items = jobs.map(j => resolveMedia(j, videos, thumbs, slides));

  // Legacy: file blob yang tidak punya job record sama sekali (render lama)
  const knownRunIds = new Set(jobs.map(j => String(j.runId)));
  for (const v of videos) {
    const rid = v.pathname.match(/video-(\d+)/)?.[1];
    if (!rid || knownRunIds.has(rid)) continue;
    knownRunIds.add(rid);
    items.push({
      runId: Number(rid), title: `video ${rid}`, mediaType: "video",
      profile: "creavoo", status: "done", createdAt: String(v.uploadedAt),
      videoUrl: v.url, thumbnailUrl: thumbs.find(t => t.pathname.includes(rid))?.url,
      legacy: true,
    });
  }
  const legacyCarousels = new Map<string, BlobFile[]>();
  for (const s of slides) {
    const rid = s.pathname.match(/^carousel-(\d+)-/)?.[1];
    if (!rid || knownRunIds.has(rid)) continue;
    if (!legacyCarousels.has(rid)) legacyCarousels.set(rid, []);
    legacyCarousels.get(rid)!.push(s);
  }
  for (const [rid, files] of legacyCarousels) {
    items.push({
      runId: Number(rid), title: "Post Carousel", mediaType: "carousel",
      profile: "creavoo", status: "done", createdAt: String(files[0].uploadedAt),
      imageUrls: files
        .sort((a, b) => parseInt(a.pathname.match(/slide-(\d+)/)?.[1] ?? "0") - parseInt(b.pathname.match(/slide-(\d+)/)?.[1] ?? "0"))
        .map(f => f.url),
      legacy: true,
    });
  }

  // Filter profile (legacy selalu tampil di "all" dan "creavoo")
  const filtered = profile === "all" ? items : items.filter(i => i.profile === profile);
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items: filtered });
}

// Hapus GitHub Actions run (cancel dulu kalau masih jalan, lalu delete)
async function deleteGithubRun(runId: number) {
  const repo = process.env.GITHUB_REPO ?? "";
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };
  await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/cancel`, {
    method: "POST", headers,
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}`, {
    method: "DELETE", headers,
  }).catch(() => {});
}

// Hapus item menyeluruh: file blob + job record + GitHub Actions run
export async function DELETE(req: NextRequest) {
  const { runId } = await req.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const { videos, thumbs, slides } = await listBlobs();
  const rid = String(runId);
  const urls = [
    ...videos.filter(v => v.pathname.includes(rid)).map(v => v.url),
    ...thumbs.filter(t => t.pathname.includes(rid)).map(t => t.url),
    ...slides.filter(s => s.pathname.startsWith(`carousel-${rid}-`)).map(s => s.url),
  ];

  // Job record ada di salah satu profile path
  const jobPaths = [`schedule/jobs/creavoo/${rid}.json`, `schedule/jobs/zaportfolio/${rid}.json`, `schedule/jobs/${rid}.json`];

  await Promise.allSettled([
    urls.length ? del(urls, { token: TOKEN }) : Promise.resolve(),
    ...jobPaths.map(p => del(p, { token: TOKEN }).catch(() => {})),
    deleteGithubRun(Number(runId)),
  ]);

  return NextResponse.json({ ok: true, deleted: urls.length });
}
