import { NextRequest, NextResponse } from "next/server";
import { put, head, list } from "@vercel/blob";

export type ScheduleSettings = {
  enabled: boolean;
  times: number[];          // jam WIB, e.g. [9, 18] = jam 9 pagi & 6 sore
  days: number[];           // 0=Minggu, 1=Senin ... 6=Sabtu
  voice: string;
  useKnowledge: boolean;
  autoTikTok: boolean;
  autoInstagram: boolean;
  igShareToFeed: boolean;
};

export type ScheduleJob = {
  runId: number;
  createdAt: string;
  status: "rendering" | "done" | "failed" | "posted";
  videoTitle: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string[];
  autoTikTok: boolean;
  autoInstagram: boolean;
  igShareToFeed: boolean;
  tiktokUrl?: string;
  instagramUrl?: string;
};

const SETTINGS_KEY = "settings/schedule.json";
const JOBS_PREFIX = "schedule/jobs/";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export const DEFAULT_SETTINGS: ScheduleSettings = {
  enabled: false,
  times: [9],
  days: [1, 2, 3, 4, 5],
  voice: "id-ID-ArdiNeural",
  useKnowledge: true,
  autoTikTok: false,
  autoInstagram: false,
  igShareToFeed: true,
};

export async function loadSettings(): Promise<ScheduleSettings> {
  try {
    const meta = await head(SETTINGS_KEY, { token: TOKEN });
    const res = await fetch(meta.url);
    return { ...DEFAULT_SETTINGS, ...(await res.json()) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: ScheduleSettings) {
  await put(SETTINGS_KEY, JSON.stringify(s), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
}

export async function saveJob(job: ScheduleJob) {
  await put(`${JOBS_PREFIX}${job.runId}.json`, JSON.stringify(job), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
}

export async function loadJob(runId: number): Promise<ScheduleJob | null> {
  try {
    const meta = await head(`${JOBS_PREFIX}${runId}.json`, { token: TOKEN });
    const res = await fetch(meta.url);
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadRecentJobs(limit = 10): Promise<ScheduleJob[]> {
  try {
    const { blobs } = await list({ prefix: JOBS_PREFIX, token: TOKEN });
    const sorted = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ).slice(0, limit);
    const jobs = await Promise.all(sorted.map(async (b) => {
      const res = await fetch(b.url);
      return res.json() as Promise<ScheduleJob>;
    }));
    return jobs;
  } catch {
    return [];
  }
}

export async function GET() {
  const [settings, jobs] = await Promise.all([loadSettings(), loadRecentJobs(10)]);
  return NextResponse.json({ settings, jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const current = await loadSettings();
  const updated: ScheduleSettings = { ...current, ...body };
  await saveSettings(updated);
  return NextResponse.json({ ok: true, settings: updated });
}
