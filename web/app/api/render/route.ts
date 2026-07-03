import { NextRequest, NextResponse } from "next/server";
import { saveJob } from "../schedule/route";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { scenes, videoTitle, subtitle, introEmoji, accent, tips, ctaText, voice, layout, watermarkHandle, watermarkLogoUrl, profile,
    caption, hashtags, autoTikTok = false, autoInstagram = false, igShareToFeed = true } = body;

  // Guard: scenes harus ada dan valid
  if (!Array.isArray(scenes) || scenes.length === 0) {
    console.error("[render] scenes missing or empty:", scenes);
    return NextResponse.json({ error: "scenes missing or empty" }, { status: 400 });
  }

  const [owner, repo] = (process.env.GITHUB_REPO ?? "").split("/");

  const dispatchBody = {
    ref: "main",
    inputs: {
      scenes_json: JSON.stringify(scenes),
      props_json: JSON.stringify({ videoTitle, subtitle, introEmoji, accent, tips, ctaText, layout: layout ?? "auto", watermarkHandle: watermarkHandle ?? "", watermarkLogoUrl: watermarkLogoUrl ?? null, profile: profile ?? "creavoo" }),
      voice: voice ?? process.env.TTS_VOICE ?? "id-ID-ArdiNeural",
    },
  };

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/render-video.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dispatchBody),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[render] GitHub dispatch failed:", res.status, err);
    console.error("[render] scenes count:", scenes.length);
    console.error("[render] props keys:", Object.keys(dispatchBody.inputs));
    return NextResponse.json({ error: err, githubStatus: res.status }, { status: 500 });
  }

  // GitHub returns 204, fetch latest run ID
  await new Promise((r) => setTimeout(r, 3000));
  const runsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
    { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } },
  );
  const runsData = await runsRes.json();
  const runId = runsData.workflow_runs?.[0]?.id ?? null;

  // Job record — webhook /api/schedule/complete pakai ini untuk auto-post
  // server-side setelah render selesai, walau browser sudah ditutup.
  if (runId) {
    await saveJob({
      runId, createdAt: new Date().toISOString(), status: "rendering", mediaType: "video",
      videoTitle: videoTitle ?? "Untitled", caption, hashtags,
      autoTikTok, autoInstagram, igShareToFeed,
      profile: profile ?? "creavoo",
    }).catch(() => {});
  }

  return NextResponse.json({ runId });
}
