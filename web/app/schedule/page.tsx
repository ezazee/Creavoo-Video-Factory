"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Sk, SkeletonStyle } from "../components/Skeleton";
import type { ScheduleSettings, DayConfig, ScheduleJob } from "../api/schedule/route";

// Creavoo: fokus social media growth, konten creator — lebih sering, prime time malam & pagi
const RECOMMENDED_CREAVOO: Partial<Record<number, DayConfig>> = {
  0: { times: [],      carouselTimes: [18],     voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Minggu   🎠18
  1: { times: [7],     carouselTimes: [20],     voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Senin    🎥07 🎠20
  2: { times: [19],    carouselTimes: [12],     voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Selasa   🎠12 🎥19
  3: { times: [7, 21], carouselTimes: [],       voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Rabu     🎥07 🎥21
  4: { times: [],      carouselTimes: [12, 19], voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Kamis    🎠12 🎠19
  5: { times: [7],     carouselTimes: [20],     voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Jumat    🎥07 🎠20
  6: { times: [10],    carouselTimes: [],       voice: "id-ID-ArdiNeural", useKnowledge: true,  igShareToFeed: true },  // Sabtu    🎥10
};

// Zaportfolio: IT/dev/portfolio — 7 hari penuh, konten teknis
const RECOMMENDED_ZAPORTFOLIO: Partial<Record<number, DayConfig>> = {
  0: { times: [10],    carouselTimes: [],       voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Minggu   🎥10
  1: { times: [8],     carouselTimes: [20],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Senin    🎥08 🎠20
  2: { times: [],      carouselTimes: [12],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Selasa   🎠12
  3: { times: [8],     carouselTimes: [19],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Rabu     🎥08 🎠19
  4: { times: [],      carouselTimes: [12],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Kamis    🎠12
  5: { times: [8],     carouselTimes: [21],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Jumat    🎥08 🎠21
  6: { times: [11],    carouselTimes: [18],     voice: "id-ID-ArdiNeural", useKnowledge: false, igShareToFeed: true },  // Sabtu    🎥11 🎠18
};

const CONTENT_THEMES = [
  { id: "it-developer", label: "IT Developer", emoji: "💻", desc: "Tech stack, coding, web dev" },
  { id: "ai",           label: "AI",           emoji: "🤖", desc: "Tools AI, tips, use cases" },
  { id: "design",       label: "Design",       emoji: "🎨", desc: "UI/UX, vector, retro" },
  { id: "tips-trick",   label: "Tips & Trick", emoji: "⚡", desc: "IT, Design, AI tips" },
];

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
  isZaportfolio,
}: {
  day: number;
  config: DayConfig;
  onChange: (cfg: DayConfig) => void;
  isZaportfolio?: boolean;
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
        {!isZaportfolio && (
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#0e0e10" }}>
            <div>
              <p className="text-sm font-medium text-zinc-200">Ikut Knowledge Creavoo</p>
              <p className="text-[11px] text-zinc-600">Script berdasarkan produk & tone Creavoo</p>
            </div>
            <Toggle on={config.useKnowledge} onToggle={() => onChange({ ...config, useKnowledge: !config.useKnowledge })} />
          </div>
        )}
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

const PROFILES = [
  { id: "creavoo", label: "Creavoo", color: "#00AEEF" },
  { id: "zaportfolio", label: "Zaportfolio", color: "#6366f1" },
];

export default function SchedulePage() {
  const [activeProfile, setActiveProfile] = useState("creavoo");
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingNotif, setTestingNotif] = useState(false);
  const [runLog, setRunLog] = useState<string[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vf_profile");
    if (stored === "zaportfolio") setActiveProfile("zaportfolio");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setSettings(null); setJobs([]);
    fetch(`/api/schedule?profile=${activeProfile}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setJobs(d.jobs ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [activeProfile]);

  const switchProfile = (p: string) => {
    localStorage.setItem("vf_profile", p);
    setActiveProfile(p);
    setExpandedDay(null);
    setRunLog(null);
  };

  const save = async (patch: Partial<ScheduleSettings>, forProfile = activeProfile) => {
    if (!settings) return;
    const prev = settings;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    setSaving(true);
    const res = await fetch(`/api/schedule?profile=${forProfile}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) setSettings(prev);
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
    const profile = activeProfile;
    const isZap = profile === "zaportfolio";
    const patch: Partial<ScheduleSettings> = isZap ? {
      days: [0, 1, 2, 3, 4, 5, 6],  // Setiap hari
      dayConfigs: RECOMMENDED_ZAPORTFOLIO,
      times: [8],
      contentTheme: "it-developer",
    } : {
      days: [0, 1, 2, 3, 4, 5, 6],  // Setiap hari
      dayConfigs: RECOMMENDED_CREAVOO,
      times: [7, 20],
    };
    await save(patch, profile);
  };

  const runNow = async () => {
    setRunning(true); setRunLog(null);
    try {
      const res = await fetch(`/api/schedule/run?profile=${activeProfile}`);
      const d = await res.json();
      setRunLog(d.log ?? [d.skipped ?? d.error ?? "done"]);
      if (d.runId) {
        setTimeout(() => {
          fetch(`/api/schedule?profile=${activeProfile}`).then(r => r.json()).then(x => setJobs(x.jobs ?? [])).catch(() => {});
        }, 3000);
      }
    } catch (e) { setRunLog([String(e)]); }
    setRunning(false);
  };

  const testPipeline = async () => {
    setTesting(true); setRunLog(null);
    try {
      const res = await fetch(`/api/schedule/run?force=true&dryrun=true&profile=${activeProfile}`);
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

  if (!settings && !loading) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <SkeletonStyle />
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* Header bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.05] flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">Auto Schedule</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Generate & post video otomatis sesuai jadwal</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-zinc-600">Menyimpan…</span>}
            {loading ? <Sk w={90} h={28} rounded={8} /> : (<>
              <button onClick={applyRecommended}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={{ background: "#6366f115", color: "#818cf8", border: "1px solid #6366f130" }}>
                ✦ Rekomendasi
              </button>
              <Toggle on={settings!.enabled} onToggle={() => save({ enabled: !settings!.enabled })} />
              <span className="text-sm font-semibold" style={{ color: settings!.enabled ? "#00AEEF" : "#52525b" }}>
                {settings!.enabled ? "Aktif" : "Nonaktif"}
              </span>
            </>)}
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT — jadwal harian */}
          <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6 flex flex-col gap-5">

            {/* Profile switcher */}
            <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: "#111113", border: "1px solid #ffffff0a" }}>
              {PROFILES.map(p => {
                const active = activeProfile === p.id;
                return (
                  <button key={p.id} onClick={() => switchProfile(p.id)}
                    className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: active ? p.color + "20" : "transparent",
                      color: active ? p.color : "#52525b",
                      border: active ? `1px solid ${p.color}40` : "1px solid transparent",
                    }}>
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="rounded-xl px-5 py-3.5 flex items-center gap-3" style={{ background: "#111113", border: "1px solid #ffffff06" }}>
                    <Sk w={40} h={40} rounded={10} />
                    <Sk h={11} w="45%" rounded={5} />
                  </div>
                ))}
              </div>
            )}

            {!loading && settings && (
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Jadwal Per Hari</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#6366f120", color: "#818cf8" }}>🎥 VIDEO OTOMATIS</span>
                  <p className="text-[11px] text-zinc-700 ml-2">Aktifkan hari lalu klik Atur</p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {DAY_NAMES.map((name, day) => {
                    const active = settings.days.includes(day);
                    const expanded = expandedDay === day;
                    const cfg = getDayConfig(day);
                    const hasCustom = !!settings.dayConfigs?.[day];
                    return (
                      <div key={day}>
                        <div className="px-5 py-3.5 flex items-center gap-3">
                          <button onClick={() => toggleDay(day)}
                            className="w-10 h-10 rounded-xl text-sm font-bold flex-shrink-0 transition-all"
                            style={{
                              background: active ? "#00AEEF" : "#ffffff09",
                              color: active ? "white" : "#52525b",
                              border: active ? "none" : "1px solid #ffffff10",
                              boxShadow: active ? "0 4px 12px #00AEEF44" : "none",
                            }}>
                            {DAY_SHORT[day]}
                          </button>
                          <div className="flex-1 min-w-0">
                            {active
                              ? <p className="text-[11px] text-zinc-500 truncate">{configSummary(cfg)}</p>
                              : <p className="text-[11px] text-zinc-700">Tidak aktif</p>}
                            {hasCustom && active && <span className="text-[9px] text-[#00AEEF] font-semibold uppercase tracking-wider">Custom</span>}
                          </div>
                          {active && (
                            <button onClick={() => setExpandedDay(expanded ? null : day)}
                              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg"
                              style={{ background: "#ffffff07" }}>
                              {expanded ? "▲ Tutup" : "▼ Atur"}
                            </button>
                          )}
                        </div>
                        {active && expanded && (
                          <DayConfigPanel day={day} config={cfg}
                            onChange={(newCfg) => updateDayConfig(day, newCfg)}
                            isZaportfolio={activeProfile === "zaportfolio"} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — settings + trigger + history */}
          <div className="w-80 flex-shrink-0 border-l border-white/[0.05] overflow-y-auto px-6 py-6 flex flex-col gap-4">

            {loading && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#111113", border: "1px solid #ffffff07" }}>
                  <Sk h={12} w="40%" rounded={6} />
                  <div className="flex gap-3"><Sk h={24} w="50%" rounded={8} /><Sk h={24} w="50%" rounded={8} /></div>
                </div>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Sk h={12} w="55%" rounded={6} /><Sk w={44} h={24} rounded={12} />
                  </div>
                ))}
              </div>
            )}

            {!loading && settings && (<>

              {/* Profil info */}
              <div className="rounded-xl p-3.5 border" style={{
                background: activeProfile === "zaportfolio" ? "#6366f108" : "#00AEEF08",
                borderColor: activeProfile === "zaportfolio" ? "#6366f130" : "#00AEEF25",
              }}>
                {activeProfile === "zaportfolio" ? (<>
                  <p className="text-xs font-bold mb-1" style={{ color: "#818cf8" }}>📐 Zaportfolio</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Konten IT/dev/portfolio. Rekomendasi: <strong className="text-zinc-400">setiap hari</strong>, 1–2x/hari, tema teknis.</p>
                </>) : (<>
                  <p className="text-xs font-bold mb-1" style={{ color: "#00AEEF" }}>🎯 Creavoo</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Konten social media & creator growth. Rekomendasi: <strong className="text-zinc-400">setiap hari</strong>, 2x/hari, tone Creavoo aktif.</p>
                </>)}
              </div>

              {/* Content Theme — zaportfolio only */}
              {activeProfile === "zaportfolio" && (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Tema Konten</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">AI generate topik sesuai tema</p>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {CONTENT_THEMES.map(t => {
                      const active = (settings.contentTheme ?? "it-developer") === t.id;
                      return (
                        <button key={t.id} onClick={() => save({ contentTheme: t.id })}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all border"
                          style={{ background: active ? "#6366f115" : "#ffffff07", borderColor: active ? "#6366f150" : "transparent" }}>
                          <span className="text-base leading-none flex-shrink-0">{t.emoji}</span>
                          <p className="text-[11px] font-bold leading-tight" style={{ color: active ? "#818cf8" : "#e4e4e7" }}>{t.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auto-Post */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Auto-Post</p>
                </div>
                {activeProfile !== "zaportfolio" && (
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span>🎵</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">TikTok</p>
                        <p className="text-[10px] text-zinc-600">Upload otomatis setelah render</p>
                      </div>
                    </div>
                    <Toggle on={settings.autoTikTok} onToggle={() => save({ autoTikTok: !settings.autoTikTok })} />
                  </div>
                )}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span>📸</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Instagram Reels</p>
                      <p className="text-[10px] text-zinc-600">Upload otomatis setelah render</p>
                    </div>
                  </div>
                  <Toggle on={settings.autoInstagram} onToggle={() => save({ autoInstagram: !settings.autoInstagram })} />
                </div>
              </div>

              {/* Manual Trigger */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Manual Trigger</p>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  <button onClick={runNow} disabled={running || testing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
                    {running ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Berjalan…</> : "▶ Jalankan Sekarang"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={testPipeline} disabled={running || testing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                      style={{ background: "#f59e0b15", color: "#fbbf24", border: "1px solid #f59e0b30" }}>
                      {testing ? <><span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> Testing…</> : "⚡ Test Pipeline"}
                    </button>
                    <button onClick={async () => { setTestingNotif(true); await fetch("/api/schedule/test-notif", { method: "POST" }); setTestingNotif(false); }}
                      disabled={testingNotif}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                      style={{ background: "#0088cc15", color: "#29b6f6", border: "1px solid #0088cc30" }}>
                      {testingNotif ? <><span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /> Kirim…</> : "🔔 Test Notif"}
                    </button>
                  </div>
                  {runLog && (
                    <div className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-1 max-h-40 overflow-y-auto" style={{ background: "#0a0a0a" }}>
                      {runLog.map((line, i) => <p key={i} className="text-xs font-mono text-zinc-400">{line}</p>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Riwayat */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Riwayat Terjadwal</p>
                </div>
                {jobs.length === 0
                  ? <p className="px-4 py-6 text-xs text-zinc-600 text-center">Belum ada video yang dijadwalkan.</p>
                  : <div className="divide-y divide-white/[0.04]">
                    {jobs.map(job => (
                      <div key={job.runId} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{job.videoTitle}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(job.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {job.tiktokUrl && <span className="text-[10px] text-green-400">🎵</span>}
                          {job.instagramUrl && <span className="text-[10px] text-green-400">📸</span>}
                          <span className={`text-[10px] font-semibold ${statusColor[job.status]}`}>{statusLabel[job.status]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Info */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "#111113" }}>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">Info</p>
                <div className="flex flex-col gap-1.5 text-[11px] text-zinc-600">
                  <p>• Cron berjalan tiap jam (Vercel Pro). Vercel Free = 1x/hari.</p>
                  <p>• Tambahkan <code className="text-zinc-400 bg-white/[0.05] px-1 rounded">SCHEDULE_WEBHOOK_SECRET</code> di GitHub Secrets untuk auto-post instan.</p>
                </div>
              </div>

            </>)}
          </div>

        </div>
      </main>
    </div>
  );
}
