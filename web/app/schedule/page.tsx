"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import type { ScheduleSettings, DayConfig, ScheduleJob } from "../api/schedule/route";

const RECOMMENDED_DAY_CONFIGS: Partial<Record<number, DayConfig>> = {
  0: { times: [],       carouselTimes: [19],   voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  1: { times: [7, 20],  carouselTimes: [],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  2: { times: [12, 21], carouselTimes: [],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  3: { times: [7, 21],  carouselTimes: [20],   voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  4: { times: [12, 20], carouselTimes: [],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  5: { times: [7, 17],  carouselTimes: [19],   voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
  6: { times: [10, 20], carouselTimes: [],     voice: "id-ID-ArdiNeural", useKnowledge: true, igShareToFeed: true },
};

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const VOICES = [
  { id: "id-ID-ArdiNeural", label: "Ardi", desc: "Indo · Male" },
  { id: "id-ID-GadisNeural", label: "Gadis", desc: "Indo · Female" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative flex-shrink-0 transition-colors duration-200 rounded-full focus:outline-none"
      style={{ width: 44, height: 24, background: on ? "#00AEEF" : "#3f3f46" }}>
      <span className="absolute top-0.5 left-0.5 rounded-full bg-white transition-transform duration-200"
        style={{ width: 20, height: 20, transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

function configSummary(cfg: DayConfig): string {
  const video = cfg.times.length
    ? `🎥 ${cfg.times.map(h => `${String(h).padStart(2, "0")}:00`).join(", ")}`
    : "";
  const carousel = (cfg.carouselTimes ?? []).length
    ? `🎠 ${(cfg.carouselTimes ?? []).map(h => `${String(h).padStart(2, "0")}:00`).join(", ")}`
    : "";
  const parts = [video, carousel].filter(Boolean).join("  ·  ") || "–";
  const voice = cfg.voice.includes("Ardi") ? "Ardi" : "Gadis";
  return `${parts} · ${voice}`;
}

function DayConfigPanel({
  day,
  config,
  onChange,
}: {
  day: number;
  config: DayConfig;
  onChange: (cfg: DayConfig) => void;
}) {
  const toggleHour = (h: number) => {
    const times = config.times.includes(h)
      ? config.times.filter(x => x !== h)
      : [...config.times, h].sort((a, b) => a - b);
    onChange({ ...config, times });
  };

  const toggleCarouselHour = (h: number) => {
    const carouselTimes = (config.carouselTimes ?? []).includes(h)
      ? (config.carouselTimes ?? []).filter(x => x !== h)
      : [...(config.carouselTimes ?? []), h].sort((a, b) => a - b);
    onChange({ ...config, carouselTimes });
  };

  return (
    <div className="border-t border-white/[0.05] px-5 py-4 flex flex-col gap-5">
      {/* Jam Video */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-400 font-semibold">🎥 Jam Video (WIB)</p>
          </div>
          {config.times.length > 0 && (
            <p className="text-[10px] text-zinc-600">{config.times.map(h => `${String(h).padStart(2, "0")}:00`).join(", ")}</p>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {HOURS.map(h => {
            const active = config.times.includes(h);
            return (
              <button key={h} onClick={() => toggleHour(h)}
                className="h-9 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: active ? "#6366f1" : "#ffffff09",
                  color: active ? "white" : "#71717a",
                  border: active ? "none" : "1px solid #ffffff10",
                  boxShadow: active ? "0 2px 8px #6366f144" : "none",
                }}>
                {String(h).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jam Carousel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-400 font-semibold">🎠 Jam Carousel (WIB)</p>
          </div>
          {(config.carouselTimes ?? []).length > 0 && (
            <p className="text-[10px] text-zinc-600">{(config.carouselTimes ?? []).map(h => `${String(h).padStart(2, "0")}:00`).join(", ")}</p>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {HOURS.map(h => {
            const active = (config.carouselTimes ?? []).includes(h);
            return (
              <button key={h} onClick={() => toggleCarouselHour(h)}
                className="h-9 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: active ? "#E1306C" : "#ffffff09",
                  color: active ? "white" : "#71717a",
                  border: active ? "none" : "1px solid #ffffff10",
                  boxShadow: active ? "0 2px 8px #E1306C44" : "none",
                }}>
                {String(h).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice */}
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-2">Voice</p>
        <div className="flex gap-2">
          {VOICES.map(v => (
            <button key={v.id} onClick={() => onChange({ ...config, voice: v.id })}
              className="px-4 py-2 rounded-xl border text-left transition-all"
              style={{
                borderColor: config.voice === v.id ? "#00AEEF" : "transparent",
                background: config.voice === v.id ? "#00AEEF15" : "#ffffff07",
              }}>
              <p className="text-[10px] text-zinc-500">{v.desc}</p>
              <p className="text-sm font-bold text-white">{v.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge & Feed */}
      <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-white/[0.06]">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#0e0e10" }}>
          <div>
            <p className="text-sm font-medium text-zinc-200">Ikut Knowledge Creavoo</p>
            <p className="text-[11px] text-zinc-600">Script berdasarkan produk & tone Creavoo</p>
          </div>
          <Toggle on={config.useKnowledge} onToggle={() => onChange({ ...config, useKnowledge: !config.useKnowledge })} />
        </div>
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.05]" style={{ background: "#0e0e10" }}>
          <div>
            <p className="text-sm font-medium text-zinc-200">Tampil di Grid / Feed</p>
            <p className="text-[11px] text-zinc-600">{config.igShareToFeed ? "Reels muncul di feed & tab Reels" : "Hanya di tab Reels"}</p>
          </div>
          <Toggle on={config.igShareToFeed} onToggle={() => onChange({ ...config, igShareToFeed: !config.igShareToFeed })} />
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runLog, setRunLog] = useState<string[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setJobs(d.jobs ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: Partial<ScheduleSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    setSaving(true);
    await fetch("/api/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
    setSaving(false);
  };

  const toggleDay = (d: number) => {
    if (!settings) return;
    const days = settings.days.includes(d)
      ? settings.days.filter(x => x !== d)
      : [...settings.days, d];
    save({ days });
    // auto expand when enabling
    if (!settings.days.includes(d)) setExpandedDay(d);
  };

  const updateDayConfig = (day: number, cfg: DayConfig) => {
    if (!settings) return;
    const dayConfigs = { ...(settings.dayConfigs ?? {}), [day]: cfg };
    save({ dayConfigs });
  };

  const getDayConfig = (day: number): DayConfig => {
    return settings?.dayConfigs?.[day] ?? {
      times: settings?.times ?? [9],
      carouselTimes: [],
      voice: settings?.voice ?? "id-ID-ArdiNeural",
      useKnowledge: settings?.useKnowledge ?? true,
      igShareToFeed: settings?.igShareToFeed ?? true,
    };
  };

  const applyRecommended = async () => {
    const patch: Partial<ScheduleSettings> = {
      days: [0, 1, 2, 3, 4, 5, 6],
      dayConfigs: RECOMMENDED_DAY_CONFIGS,
      times: [7, 20],
    };
    await save(patch);
  };

  const runNow = async () => {
    setRunning(true); setRunLog(null);
    try {
      const res = await fetch("/api/schedule/run");
      const d = await res.json();
      setRunLog(d.log ?? [d.skipped ?? d.error ?? "done"]);
      if (d.runId) {
        setTimeout(() => {
          fetch("/api/schedule").then(r => r.json()).then(x => setJobs(x.jobs ?? [])).catch(() => {});
        }, 3000);
      }
    } catch (e) { setRunLog([String(e)]); }
    setRunning(false);
  };

  const testPipeline = async () => {
    setTesting(true); setRunLog(null);
    try {
      const res = await fetch("/api/schedule/run?force=true&dryrun=true");
      const d = await res.json();
      setRunLog(d.log ?? [d.error ?? "done"]);
    } catch (e) { setRunLog([String(e)]); }
    setTesting(false);
  };

  const statusColor: Record<ScheduleJob["status"], string> = {
    rendering: "text-yellow-400",
    done: "text-zinc-400",
    failed: "text-red-400",
    posted: "text-green-400",
  };
  const statusLabel: Record<ScheduleJob["status"], string> = {
    rendering: "⟳ Rendering",
    done: "✓ Selesai",
    failed: "✗ Gagal",
    posted: "✓ Posted",
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin" />
        </main>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Auto Schedule</h2>
              <p className="text-zinc-500 text-sm mt-1">Generate & post video otomatis sesuai jadwal</p>
            </div>
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-600">Menyimpan…</span>}
              <button
                onClick={applyRecommended}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={{ background: "#6366f115", color: "#818cf8", border: "1px solid #6366f130" }}
                title="Terapkan jadwal rekomendasi (Sen–Sab, 2x sehari)">
                ✦ Rekomendasi
              </button>
              <Toggle on={settings.enabled} onToggle={() => save({ enabled: !settings.enabled })} />
              <span className="text-sm font-semibold" style={{ color: settings.enabled ? "#00AEEF" : "#52525b" }}>
                {settings.enabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>

          {/* Per-day config */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Jadwal Per Hari</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#6366f120", color: "#818cf8" }}>🎥 VIDEO OTOMATIS</span>
              </div>
              <p className="text-[11px] text-zinc-600">Aktifkan hari lalu klik untuk atur jam, voice, dan opsi per hari</p>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {DAY_NAMES.map((name, day) => {
                const active = settings.days.includes(day);
                const expanded = expandedDay === day;
                const cfg = getDayConfig(day);
                const hasCustom = !!settings.dayConfigs?.[day];

                return (
                  <div key={day}>
                    {/* Day row */}
                    <div className="px-5 py-3.5 flex items-center gap-3">
                      {/* Active toggle */}
                      <button
                        onClick={() => toggleDay(day)}
                        className="w-10 h-10 rounded-xl text-sm font-bold flex-shrink-0 transition-all"
                        style={{
                          background: active ? "#00AEEF" : "#ffffff09",
                          color: active ? "white" : "#52525b",
                          border: active ? "none" : "1px solid #ffffff10",
                          boxShadow: active ? "0 4px 12px #00AEEF44" : "none",
                        }}>
                        {DAY_SHORT[day]}
                      </button>

                      {/* Summary */}
                      <div className="flex-1 min-w-0">
                        {active ? (
                          <p className="text-[11px] text-zinc-500 truncate">{configSummary(cfg)}</p>
                        ) : (
                          <p className="text-[11px] text-zinc-700">Tidak aktif</p>
                        )}
                        {hasCustom && active && (
                          <span className="text-[9px] text-[#00AEEF] font-semibold uppercase tracking-wider">Custom</span>
                        )}
                      </div>

                      {/* Expand button — only when active */}
                      {active && (
                        <button
                          onClick={() => setExpandedDay(expanded ? null : day)}
                          className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg"
                          style={{ background: "#ffffff07" }}>
                          {expanded ? "▲ Tutup" : "▼ Atur"}
                        </button>
                      )}
                    </div>

                    {/* Expanded config */}
                    {active && expanded && (
                      <DayConfigPanel
                        day={day}
                        config={cfg}
                        onChange={(newCfg) => updateDayConfig(day, newCfg)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-post settings */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Auto-Post</p>
            </div>

            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎵</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Auto-post TikTok</p>
                  <p className="text-[11px] text-zinc-600">Upload otomatis setelah render</p>
                </div>
              </div>
              <Toggle on={settings.autoTikTok} onToggle={() => save({ autoTikTok: !settings.autoTikTok })} />
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📸</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Auto-post Instagram Reels</p>
                  <p className="text-[11px] text-zinc-600">Upload otomatis setelah render</p>
                </div>
              </div>
              <Toggle on={settings.autoInstagram} onToggle={() => save({ autoInstagram: !settings.autoInstagram })} />
            </div>
          </div>

          {/* Manual trigger */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Manual Trigger</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <p className="text-xs text-zinc-500">Jalankan satu siklus sekarang: cek pending jobs + generate video baru.</p>
              <div className="flex gap-2">
                <button onClick={runNow} disabled={running || testing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
                  {running
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Berjalan…</>
                    : "▶ Jalankan Sekarang"}
                </button>
                <button onClick={testPipeline} disabled={running || testing}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  style={{ background: "#f59e0b15", color: "#fbbf24", border: "1px solid #f59e0b30" }}
                  title="Force generate + render sekarang, bypass cek jadwal">
                  {testing
                    ? <><span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> Testing…</>
                    : "⚡ Test Pipeline"}
                </button>
              </div>
              {runLog && (
                <div className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-1" style={{ background: "#0a0a0a" }}>
                  {runLog.map((line, i) => (
                    <p key={i} className="text-xs font-mono text-zinc-400">{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Job history */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Riwayat Scheduled</p>
            </div>
            {jobs.length === 0 ? (
              <p className="px-5 py-8 text-xs text-zinc-600 text-center">Belum ada video yang dijadwalkan.</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {jobs.map(job => (
                  <div key={job.runId} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{job.videoTitle}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{timeAgo(job.createdAt)} · run #{job.runId}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {job.tiktokUrl && <span className="text-[10px] text-green-400 font-medium">🎵</span>}
                      {job.instagramUrl && <span className="text-[10px] text-green-400 font-medium">📸</span>}
                      <span className={`text-xs font-semibold ${statusColor[job.status]}`}>
                        {statusLabel[job.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "#111113" }}>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">Info</p>
            <div className="flex flex-col gap-1.5 text-xs text-zinc-600">
              <p>• Cron berjalan setiap jam (membutuhkan Vercel Pro untuk interval per jam). Vercel Free = 1x/hari.</p>
              <p>• Tambahkan <code className="text-zinc-400 bg-white/[0.05] px-1 rounded">SCHEDULE_WEBHOOK_SECRET</code> di GitHub Secrets untuk auto-post instan setelah render.</p>
              <p>• Tanpa webhook, auto-post dicek di cron berikutnya (max delay 1 jam).</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
