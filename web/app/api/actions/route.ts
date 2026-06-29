import { NextRequest, NextResponse } from "next/server";

const GH_HEADERS = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};
const REPO = process.env.GITHUB_REPO ?? "";

export async function GET(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const [runRes, jobsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}`, { headers: GH_HEADERS }),
    fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}/jobs`, { headers: GH_HEADERS }),
  ]);

  const run = await runRes.json();
  const jobs = await jobsRes.json();

  // Ambil job yang sedang berjalan, atau job terakhir kalau semua sudah selesai
  const allJobs: { id: number; name: string; status: string; conclusion: string | null; steps?: unknown[] }[] = jobs.jobs ?? [];
  const activeJob = allJobs.find(j => j.status === "in_progress") ?? allJobs[allJobs.length - 1];
  const job = activeJob;

  const steps = (job?.steps ?? []).map((s: {
    name: string; status: string; conclusion: string | null;
    started_at: string | null; completed_at: string | null; number: number;
  }) => ({
    name: s.name,
    status: s.status,
    conclusion: s.conclusion,
    startedAt: s.started_at,
    completedAt: s.completed_at,
    number: s.number,
  }));

  // Frame progress dari render step yang aktif
  let renderFrame: number | null = null;
  let renderTotal: number | null = null;
  const renderStep = steps.find((s: { name: string; status: string }) =>
    s.name === "Render video with Remotion" && s.status === "in_progress"
  );
  if (renderStep && job?.id) {
    try {
      const logsRes = await fetch(
        `https://api.github.com/repos/${REPO}/actions/jobs/${job.id}/logs`,
        { headers: GH_HEADERS, redirect: "follow" }
      );
      if (logsRes.ok) {
        const logs = await logsRes.text();
        const matches = [...logs.matchAll(/(\d+)\/(\d+)/g)];
        if (matches.length) {
          const last = matches[matches.length - 1];
          renderFrame = parseInt(last[1]);
          renderTotal = parseInt(last[2]);
        }
      }
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({
    status: run.status,
    conclusion: run.conclusion,
    steps,
    htmlUrl: run.html_url,
    runStartedAt: run.run_started_at,
    renderFrame,
    renderTotal,
  });
}

export async function DELETE(req: NextRequest) {
  const { runId } = await req.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}/cancel`, {
    method: "POST", headers: GH_HEADERS,
  });

  await new Promise((r) => setTimeout(r, 1500));
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}`, {
    method: "DELETE", headers: GH_HEADERS,
  });

  return NextResponse.json({ ok: res.ok || res.status === 204 });
}
