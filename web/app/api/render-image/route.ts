import { NextRequest, NextResponse } from "next/server";
import { saveJob } from "../schedule/route";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    videoTitle, subtitle, introEmoji, accent, tips, ctaText, layout,
    watermarkHandle, watermarkLogoUrl,
    type = "single",  // "single" | "carousel"
    totalSlides = 7,
    style = "creavoo",
    caption, hashtags, autoInstagram = false,
  } = body;

  const resolvedAccent = style === "zaportfolio" ? "#1a3358" : accent;
  const [owner, repo] = (process.env.GITHUB_REPO ?? "").split("/");

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/render-image.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          props_json: JSON.stringify({
            videoTitle, subtitle, introEmoji, accent: resolvedAccent, tips, ctaText,
            layout: layout ?? "auto",
            watermarkHandle: watermarkHandle ?? "",
            watermarkLogoUrl: watermarkLogoUrl ?? null,
          }),
          type,
          total_slides: String(totalSlides),
          style,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  await new Promise((r) => setTimeout(r, 3000));
  const runsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
    { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } },
  );
  const runsData = await runsRes.json();
  const runId = runsData.workflow_runs?.[0]?.id ?? null;

  // Job record — webhook /api/schedule/complete auto-post carousel ke Instagram
  // server-side setelah render selesai, walau browser sudah ditutup.
  if (runId && type === "carousel") {
    await saveJob({
      runId, createdAt: new Date().toISOString(), status: "rendering", mediaType: "carousel",
      videoTitle: videoTitle ?? "Untitled", caption, hashtags,
      autoTikTok: false, autoInstagram, igShareToFeed: true,
      profile: style ?? "creavoo",
    }).catch(() => {});
  }

  return NextResponse.json({ runId });
}
