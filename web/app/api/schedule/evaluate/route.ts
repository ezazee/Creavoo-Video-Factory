import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getZernioKey, loadConfig } from "@/lib/config";
import { loadSettings, saveSettings, type DayConfig } from "../route";
import { sendTelegram } from "@/lib/telegram";

export const maxDuration = 120;

const ZERNIO_BASE = "https://zernio.com/api/v1";
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type ZPost = {
  platform: string;
  publishedAt: string;
  analytics?: { views?: number; likes?: number; comments?: number; shares?: number; engagementRate?: number };
};

async function fetchWeekPosts(token: string): Promise<ZPost[]> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const res = await fetch(
    `${ZERNIO_BASE}/analytics?fromDate=${fmt(fromDate)}&toDate=${fmt(toDate)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Zernio analytics ${res.status}`);
  const d = await res.json();
  return d.posts ?? [];
}

// Validasi dayConfigs hasil AI: Senin(1)-Sabtu(6) wajib tepat 1 item jam 9-20,
// Minggu(0) selalu kosong. Kalau ada yang gagal, jadwal lama dipakai (fail-safe).
function validateDayConfigs(dc: unknown, fallback: Record<number, DayConfig>): { valid: boolean; result: Record<number, DayConfig> } {
  if (!dc || typeof dc !== "object") return { valid: false, result: fallback };
  const src = dc as Record<string, { times?: unknown; carouselTimes?: unknown }>;
  const result: Record<number, DayConfig> = { 0: { ...fallback[0], times: [], carouselTimes: [] } };
  for (let day = 1; day <= 6; day++) {
    const c = src[String(day)];
    const times = Array.isArray(c?.times) ? c.times.filter((h): h is number => typeof h === "number") : [];
    const carouselTimes = Array.isArray(c?.carouselTimes) ? c.carouselTimes.filter((h): h is number => typeof h === "number") : [];
    const total = times.length + carouselTimes.length;
    const allInRange = [...times, ...carouselTimes].every((h) => h >= 9 && h <= 20);
    if (total !== 1 || !allInRange) return { valid: false, result: fallback };
    result[day] = { ...fallback[day], times, carouselTimes };
  }
  return { valid: true, result };
}

export async function POST(req: NextRequest) {
  const { profile = "creavoo" } = await req.json().catch(() => ({}));
  const isZap = profile === "zaportfolio";

  try {
    const token = getZernioKey(profile);
    const settings = await loadSettings(profile);
    const posts = token ? await fetchWeekPosts(token).catch(() => []) : [];

    // Ringkas performa per hari+jam WIB — cukup untuk AI melihat pola tanpa data mentah berlebih
    const summary = posts.map((p) => {
      const wib = new Date(new Date(p.publishedAt).getTime() + 7 * 3600 * 1000);
      const a = p.analytics ?? {};
      return {
        day: DAY_NAMES[wib.getUTCDay()],
        hour: wib.getUTCHours(),
        platform: p.platform,
        views: a.views ?? 0,
        likes: a.likes ?? 0,
        engagementRate: a.engagementRate ?? 0,
      };
    });

    const currentSchedule = Object.fromEntries(
      [1, 2, 3, 4, 5, 6].map((d) => {
        const c = settings.dayConfigs?.[d];
        const type = (c?.times?.length ?? 0) > 0 ? `video jam ${c!.times[0]}` : (c?.carouselTimes?.length ?? 0) > 0 ? `carousel jam ${c!.carouselTimes[0]}` : "kosong";
        return [DAY_NAMES[d], type];
      }),
    );

    const config = await loadConfig();
    const client = new OpenAI({ baseURL: config.aiBaseUrl, apiKey: config.aiApiKey });

    const prompt = `Kamu adalah social media strategist. Evaluasi performa akun ${isZap ? "Zaportfolio (Instagram-only, niche developer/IT)" : "Creavoo (TikTok + Instagram, niche social media growth)"} minggu ini dan usulkan jadwal posting minggu depan.

JADWAL SAAT INI (Senin-Sabtu, Minggu tidak posting/hari evaluasi):
${JSON.stringify(currentSchedule, null, 2)}

DATA PERFORMA POSTING 7 HARI TERAKHIR (hour dalam WIB 24 jam):
${posts.length === 0 ? "Tidak ada data post minggu ini (mungkin baru mulai / API analytics kosong)." : JSON.stringify(summary, null, 2)}

Tugasmu:
1. Tulis evaluasi singkat bahasa Indonesia (3-5 kalimat): jam/hari mana yang performanya bagus, mana yang jelek, dan KENAPA menurutmu begitu (kalau data kosong, bilang jujur data belum cukup dan pertahankan jadwal lama).
2. Usulkan jadwal BARU untuk minggu depan, Senin-Sabtu (Minggu selalu kosong, itu hari evaluasi bukan posting).

ATURAN WAJIB untuk jadwal baru:
- Senin sampai Sabtu: TEPAT SATU konten per hari (video ATAU carousel, tidak dua-duanya)
- Jam harus antara 9 dan 20 (WIB)
- Total minggu: usahakan MAYORITAS video/reels (minimal 3 dari 6 hari), sisanya carousel
- Kalau data performa tidak cukup untuk mengambil kesimpulan kuat, JANGAN ubah jadwal drastis — pertahankan sebagian besar jam yang sudah ada, geser sedikit saja kalau ada indikasi

Balas HANYA JSON (tanpa markdown), format:
{
  "narrative": "evaluasi singkat...",
  "dayConfigs": {
    "1": {"times": [9], "carouselTimes": []},
    "2": {"times": [], "carouselTimes": [14]},
    "3": {"times": [19], "carouselTimes": []},
    "4": {"times": [11], "carouselTimes": []},
    "5": {"times": [], "carouselTimes": [16]},
    "6": {"times": [20], "carouselTimes": []}
  }
}`;

    const completion = await client.chat.completions.create({
      model: config.aiModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    let narrative = "AI tidak mengembalikan evaluasi yang valid — jadwal dipertahankan.";
    let applied = false;

    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        narrative = typeof parsed.narrative === "string" && parsed.narrative.trim() ? parsed.narrative : narrative;
        const { valid, result } = validateDayConfigs(parsed.dayConfigs, settings.dayConfigs as Record<number, DayConfig>);
        if (valid) {
          await saveSettings({ ...settings, dayConfigs: result }, profile);
          applied = true;
        }
      } catch { /* narrative fallback tetap dipakai, jadwal tidak diubah */ }
    }

    return NextResponse.json({ ok: true, profile, narrative, applied, postsAnalyzed: posts.length });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    await sendTelegram(`⚠️ <b>Evaluasi mingguan ${profile} gagal</b>\n${msg.slice(0, 300)}`).catch(() => {});
    return NextResponse.json({ ok: false, profile, error: msg }, { status: 200 });
  }
}
