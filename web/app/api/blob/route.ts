import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET() {
  const { blobs } = await list({ token: TOKEN });

  const videos = blobs
    .filter((b) => b.pathname.endsWith(".mp4"))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((b) => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt, size: b.size }));

  // Single images: image-{runId}.jpg
  const singleImages = blobs
    .filter((b) => /^image-\d+\.jpg$/.test(b.pathname))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((b) => ({
      url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt,
      runId: b.pathname.match(/^image-(\d+)\.jpg$/)?.[1] ?? "",
    }));

  // Carousel: carousel-{runId}-slide-{n}.jpg — group by runId
  const carouselBlobs = blobs.filter((b) => /^carousel-\d+-slide-\d+\.jpg$/.test(b.pathname));
  const groups: Record<string, typeof carouselBlobs> = {};
  for (const b of carouselBlobs) {
    const runId = b.pathname.match(/^carousel-(\d+)-/)?.[1] ?? "unknown";
    (groups[runId] ??= []).push(b);
  }
  const carousels = Object.entries(groups).map(([runId, slides]) => {
    const sorted = [...slides].sort((a, b) => {
      const na = parseInt(a.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
      const nb = parseInt(b.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
      return na - nb;
    });
    return { runId, slides: sorted.map((s) => s.url), uploadedAt: sorted[0]?.uploadedAt ?? "" };
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return NextResponse.json({ videos, singleImages, carousels });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  // Support single url or multiple urls[]
  const urls: string[] = body.urls?.length ? body.urls : body.url ? [body.url] : [];
  if (!urls.length) return NextResponse.json({ error: "url or urls required" }, { status: 400 });
  await Promise.all(urls.map((u) => del(u, { token: TOKEN })));
  return NextResponse.json({ ok: true });
}
