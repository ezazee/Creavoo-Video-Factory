import { NextRequest, NextResponse } from "next/server";
import { put, head, list } from "@vercel/blob";

export type DayConfig = {
  times: number[];          // jam WIB untuk video
  carouselTimes: number[];  // jam WIB untuk carousel
  voice: string;
  useKnowledge: boolean;
  igShareToFeed: boolean;
};

export type ScheduleSettings = {
  enabled: boolean;
  days: number[];           // 0=Minggu ... 6=Sabtu — hari mana yang aktif
  dayConfigs: Partial<Record<number, DayConfig>>;  // config per hari
  autoTikTok: boolean;
  autoInstagram: boolean;
  // global defaults — dipakai kalau hari belum punya dayConfig sendiri
  times: number[];
  voice: string;
  useKnowledge: boolean;
  igShareToFeed: boolean;
};

export type ScheduleJob = {
  runId: number;
  createdAt: string;
  status: "rendering" | "done" | "failed" | "posted";
  mediaType: "video" | "carousel";
  videoTitle: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
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

export const DEFAULT_DAY_CONFIG: DayConfig = {
  times: [9],
  carouselTimes: [],
  voice: "id-ID-ArdiNeural",
  useKnowledge: true,
  igShareToFeed: true,
};

export const RECOMMENDED_SETTINGS: Omit<ScheduleSettings, "enabled" | "autoTikTok" | "autoInstagram"> = {
  days: [0, 1, 2, 3, 4, 5, 6],
  voice: "id-ID-ArdiNeural",
  useKnowledge: true,
  igShareToFeed: true,
  times: [7, 20],
  dayConfigs: {
    // 6 video + 6 carousel per minggu, tidak ada jam yang tumpang tindih
    0: { times: [],      carouselTimes: [19],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Minggu   — 🎠19
    1: { times: [7],     carouselTimes: [21],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Senin    — 🎥07  🎠21
    2: { times: [20],    carouselTimes: [12],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Selasa   — 🎠12  🎥20
    3: { times: [7, 21], carouselTimes: [],       voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Rabu     — 🎥07  🎥21
    4: { times: [],      carouselTimes: [12, 19], voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Kamis    — 🎠12  🎠19
    5: { times: [7],     carouselTimes: [20],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Jumat    — 🎥07  🎠20
    6: { times: [10],    carouselTimes: [],       voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },  // Sabtu    — 🎥10
  },
};

export const DEFAULT_SETTINGS: ScheduleSettings = {
  enabled: false,
  autoTikTok: false,
  autoInstagram: false,
  ...RECOMMENDED_SETTINGS,
};

export function getDayConfig(settings: ScheduleSettings, day: number): DayConfig {
  return settings.dayConfigs?.[day] ?? {
    times: settings.times,
    carouselTimes: [],
    voice: settings.voice,
    useKnowledge: settings.useKnowledge,
    igShareToFeed: settings.igShareToFeed,
  };
}

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
