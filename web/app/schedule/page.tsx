"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import type { ScheduleSettings, ScheduleJob } from "../api/schedule/route";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
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

export default function SchedulePage() {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[] | null>(null);

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
  };

  const toggleHour = (h: number) => {
    if (!settings) return;
    const times = settings.times.includes(h)
      ? settings.times.filter(x => x !== h)
      : [...settings.times, h].sort((a, b) => a - b);
    save({ times });
  };

  const runNow = async () => {
    setRunning(true); setRunLog(null);
    try {
      const res = await fetch("/api/schedule/tick");
      const d = await res.json();
      setRunLog(d.log ?? [d.skipped ?? d.error ?? "done"]);
      if (d.runId) {
        // Refresh jobs setelah beberapa detik
        setTimeout(() => {
          fetch("/api/schedule").then(r => r.json()).then(x => setJobs(x.jobs ?? [])).catch(() => {});
        }, 3000);
      }
    } catch (e) { setRunLog([String(e)]); }
    setRunning(false);
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
              <Toggle on={settings.enabled} onToggle={() => save({ enabled: !settings.enabled })} />
              <span className="text-sm font-semibold" style={{ color: settings.enabled ? "#00AEEF" : "#52525b" }}>
                {settings.enabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>

          {/* Hari */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Hari</p>
            </div>
            <div className="px-5 py-4 flex gap-2 flex-wrap">
              {DAYS.map((label, i) => {
                const active = settings.days.includes(i);
                return (
                  <button key={i} onClick={() => toggleDay(i)}
                    className="w-12 h-12 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: active ? "#00AEEF" : "#ffffff09",
                      color: active ? "white" : "#71717a",
                      border: active ? "none" : "1px solid #ffffff10",
                      boxShadow: active ? "0 4px 12px #00AEEF44" : "none",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jam */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Jam Posting (WIB)</p>
                {settings.times.length > 0 && (
                  <p className="text-xs text-zinc-600">{settings.times.map(h => `${String(h).padStart(2, "0")}:00`).join(", ")}</p>
                )}
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-6 gap-2">
              {HOURS.map(h => {
                const active = settings.times.includes(h);
                return (
                  <button key={h} onClick={() => toggleHour(h)}
                    className="h-10 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: active ? "#00AEEF" : "#ffffff09",
                      color: active ? "white" : "#71717a",
                      border: active ? "none" : "1px solid #ffffff10",
                      boxShadow: active ? "0 4px 12px #00AEEF44" : "none",
                    }}>
                    {String(h).padStart(2, "0")}:00
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Pengaturan Video</p>
            </div>

            {/* Voice */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-xs text-zinc-500 mb-3">Voice</p>
              <div className="flex gap-2">
                {VOICES.map(v => (
                  <button key={v.id} onClick={() => save({ voice: v.id })}
                    className="px-4 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: settings.voice === v.id ? "#00AEEF" : "transparent",
                      background: settings.voice === v.id ? "#00AEEF15" : "#ffffff07",
                    }}>
                    <p className="text-[10px] text-zinc-500">{v.desc}</p>
                    <p className="text-sm font-bold text-white">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Ikut Knowledge Creavoo</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">Script berdasarkan produk & tone Creavoo</p>
              </div>
              <Toggle on={settings.useKnowledge} onToggle={() => save({ useKnowledge: !settings.useKnowledge })} />
            </div>

            {/* Auto-post TikTok */}
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

            {/* Auto-post Instagram */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📸</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Auto-post Instagram Reels</p>
                  <p className="text-[11px] text-zinc-600">Upload otomatis setelah render</p>
                </div>
              </div>
              <Toggle on={settings.autoInstagram} onToggle={() => save({ autoInstagram: !settings.autoInstagram })} />
            </div>

            {/* Share to feed */}
            <div className="px-5 py-4 flex items-center justify-between pl-12">
              <div>
                <p className="text-xs font-medium text-zinc-400">Tampil di grid / feed profil</p>
                <p className="text-[11px] text-zinc-600">{settings.igShareToFeed ? "Reels muncul di feed & tab Reels" : "Hanya di tab Reels"}</p>
              </div>
              <Toggle on={settings.igShareToFeed} onToggle={() => save({ igShareToFeed: !settings.igShareToFeed })} />
            </div>
          </div>

          {/* Run Now */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Manual Trigger</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <p className="text-xs text-zinc-500">Jalankan satu siklus sekarang: cek pending jobs + generate video baru (jika jadwal aktif & waktunya cocok, atau paksa dari sini).</p>
              <button onClick={runNow} disabled={running}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
                {running
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Berjalan…</>
                  : "▶ Jalankan Sekarang"}
              </button>
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
