import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const [owner, repo] = (process.env.GITHUB_REPO ?? "").split("/");

  // Check GitHub Actions run status
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );
  const run = await res.json();

  if (run.status === "completed" && run.conclusion === "success") {
    // Find video + thumbnail in Vercel Blob by run ID prefix
    const { blobs } = await list({ prefix: `video-${runId}` });
    const blob = blobs[0];
    if (blob) {
      const { blobs: thumbBlobs } = await list({ prefix: `thumbnail-${runId}` });
      return NextResponse.json({
        status: "completed",
        videoUrl: blob.url,
        thumbnailUrl: thumbBlobs[0]?.url ?? null,
      });
    }
    // Blob not yet visible (eventual consistency), retry soon
    return NextResponse.json({ status: "uploading" });
  }

  if (run.status === "completed" && run.conclusion !== "success") {
    return NextResponse.json({ status: "failed" });
  }

  return NextResponse.json({ status: "running" });
}
