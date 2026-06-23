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

  const job = jobs.jobs?.[0];
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

  return NextResponse.json({
    status: run.status,
    conclusion: run.conclusion,
    steps,
    htmlUrl: run.html_url,
    runStartedAt: run.run_started_at,
  });
}

export async function DELETE(req: NextRequest) {
  const { runId } = await req.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  // Cancel first if still running
  await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}/cancel`, {
    method: "POST", headers: GH_HEADERS,
  });

  // Wait briefly then delete
  await new Promise((r) => setTimeout(r, 1500));
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}`, {
    method: "DELETE", headers: GH_HEADERS,
  });

  return NextResponse.json({ ok: res.ok || res.status === 204 });
}
