import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const [owner, repo] = GITHUB_REPO.split("/");
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: `GitHub ${res.status}` }, { status: res.status });
  }

  const d = await res.json();
  return NextResponse.json({ status: d.status, conclusion: d.conclusion });
}
