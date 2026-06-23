import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  // Single post
  const { blobs: single } = await list({ prefix: `image-${runId}`, token: TOKEN });
  if (single[0]) {
    return NextResponse.json({ type: "single", imageUrl: single[0].url });
  }

  // Carousel slides
  const { blobs: slides } = await list({ prefix: `carousel-${runId}-`, token: TOKEN });
  if (slides.length > 0) {
    const sorted = slides
      .sort((a, b) => {
        // carousel-{runId}-slide-{n}.jpg
        const na = parseInt(a.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        const nb = parseInt(b.pathname.match(/slide-(\d+)\.jpg$/)?.[1] ?? "0");
        return na - nb;
      })
      .map(b => b.url);
    return NextResponse.json({ type: "carousel", slides: sorted });
  }

  return NextResponse.json({ imageUrl: null });
}
