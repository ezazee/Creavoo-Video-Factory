import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { scenes, videoTitle, subtitle, introEmoji, accent, tips, ctaText, voice, layout, watermarkHandle, watermarkLogoUrl } = body;

  const [owner, repo] = (process.env.GITHUB_REPO ?? "").split("/");

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/render-video.yml/dispatches`,
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
          scenes_json: JSON.stringify(scenes),
          props_json: JSON.stringify({ videoTitle, subtitle, introEmoji, accent, tips, ctaText, layout: layout ?? "center", watermarkHandle: watermarkHandle ?? "", watermarkLogoUrl: watermarkLogoUrl ?? null }),
          voice: voice ?? process.env.TTS_VOICE ?? "id-ID-ArdiNeural",
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  // GitHub returns 204, fetch latest run ID
  await new Promise((r) => setTimeout(r, 3000));
  const runsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
    { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } },
  );
  const runsData = await runsRes.json();
  const runId = runsData.workflow_runs?.[0]?.id ?? null;

  return NextResponse.json({ runId });
}
