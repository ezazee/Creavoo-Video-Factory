"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Step = "idle" | "generating" | "rendering" | "done" | "error";
type HistoryItem = {
  id: string; title: string; status: "done" | "rendering" | "failed";
  videoUrl?: string; runId?: number; accent: string; createdAt: string;
};
type SceneData = {
  videoTitle: string; subtitle: string; introEmoji: string; accent: string;
  tips: { title: string; subtitle: string; emoji: string }[];
  ctaText: string; scenes: { id: string; text: string }[]; layout?: string;
};

// ─── Layout Previews ──────────────────────────────────────────────────────────

function PreviewCenter({ color }: { color: string }) {
  return (
    <div style={{ background: "#0a0a0a", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 42%, ${color}33 0%, transparent 65%)` }} />
      {/* badge */}
      <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translate(-50%,-50%)", width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", boxShadow: `0 0 12px ${color}88` }}>1</div>
      {/* emoji placeholder */}
      <div style={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 28 }}>🎯</div>
      {/* text lines centered */}
      <div style={{ position: "absolute", top: "60%", left: "18%", right: "18%", height: 6, background: "#fff", borderRadius: 3 }} />
      <div style={{ position: "absolute", top: "69%", left: "22%", right: "22%", height: 4, background: "#52525b", borderRadius: 3 }} />
      <div style={{ position: "absolute", top: "76%", left: "25%", right: "25%", height: 4, background: "#3f3f46", borderRadius: 3 }} />
    </div>
  );
}

function PreviewSide({ color }: { color: string }) {
  return (
    <div style={{ background: "#0a0a0a", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* accent bar left */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: "100%", background: color, boxShadow: `0 0 14px ${color}` }} />
      {/* big watermark number */}
      <div style={{ position: "absolute", right: -10, top: -10, fontSize: 120, fontWeight: 900, color: `${color}12`, lineHeight: 1 }}>1</div>
      {/* badge */}
      <div style={{ position: "absolute", top: "20%", left: "14%", width: 24, height: 24, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>1</div>
      {/* emoji left */}
      <div style={{ position: "absolute", top: "36%", left: "14%", fontSize: 24 }}>🎯</div>
      {/* text lines left */}
      <div style={{ position: "absolute", top: "55%", left: "14%", right: "10%", height: 7, background: "#fff", borderRadius: 3 }} />
      <div style={{ position: "absolute", top: "64%", left: "14%", right: "18%", height: 4, background: "#52525b", borderRadius: 3 }} />
      <div style={{ position: "absolute", top: "71%", left: "14%", right: "22%", height: 4, background: "#3f3f46", borderRadius: 3 }} />
      {/* accent underline */}
      <div style={{ position: "absolute", top: "80%", left: "14%", width: 30, height: 4, background: color, borderRadius: 2 }} />
    </div>
  );
}

function PreviewBold({ color }: { color: string }) {
  return (
    <div style={{ background: "#0a0a0a", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* top strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      {/* huge bg number */}
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", fontSize: 160, fontWeight: 900, color: `${color}0d`, lineHeight: 1 }}>1</div>
      {/* emoji */}
      <div style={{ position: "absolute", top: "24%", left: "50%", transform: "translateX(-50%)", fontSize: 30 }}>🎯</div>
      {/* title lines centered */}
      <div style={{ position: "absolute", top: "52%", left: "12%", right: "12%", height: 7, background: "#fff", borderRadius: 3 }} />
      {/* divider */}
      <div style={{ position: "absolute", top: "62%", left: "35%", right: "35%", height: 3, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
      {/* subtitle lines */}
      <div style={{ position: "absolute", top: "70%", left: "16%", right: "16%", height: 4, background: "#52525b", borderRadius: 3 }} />
      <div style={{ position: "absolute", top: "77%", left: "20%", right: "20%", height: 4, background: "#3f3f46", borderRadius: 3 }} />
      {/* outline badge bottom right */}
      <div style={{ position: "absolute", bottom: "8%", right: "10%", width: 22, height: 22, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color }} >1</div>
    </div>
  );
}

type LayoutKey = "center" | "side" | "bold";
const LAYOUT_PREVIEWS: Record<LayoutKey, React.FC<{ color: string }>> = {
  center: PreviewCenter,
  side: PreviewSide,
  bold: PreviewBold,
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "5-tips", emoji: "🎯", label: "5 Tips Praktis", desc: "Lima tips yang langsung bisa dipake sekarang", color: "#6366f1", layout: "center" as LayoutKey },
  { id: "explained", emoji: "🧠", label: "Explained", desc: "Jelasin konsep dari nol sampai beneran ngerti", color: "#3b82f6", layout: "bold" as LayoutKey },
  { id: "mistakes", emoji: "🔥", label: "Common Mistakes", desc: "Kesalahan paling sering + cara benarnya", color: "#ef4444", layout: "bold" as LayoutKey },
  { id: "beginner-vs-pro", emoji: "⚡", label: "Beginner vs Pro", desc: "Cara berpikir pemula vs yang udah expert", color: "#eab308", layout: "side" as LayoutKey },
  { id: "hidden-gems", emoji: "💎", label: "Hidden Gems", desc: "Hal tersembunyi yang jarang banget diketahui", color: "#22c55e", layout: "side" as LayoutKey },
  { id: "tutorial", emoji: "🚀", label: "Quick Tutorial", desc: "Step-by-step yang padat dan langsung to the point", color: "#f97316", layout: "side" as LayoutKey },
];

type ELVoice = { id: string; label: string; desc: string; previewUrl?: string | null };
const EL_VOICES_FALLBACK: ELVoice[] = [
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam", desc: "Deep · Narrative" },
];

const FREE_VOICES = [
  { id: "id-ID-ArdiNeural", label: "Ardi", desc: "Indo · Laki", flag: "🇮🇩" },
  { id: "id-ID-GadisNeural", label: "Gadis", desc: "Indo · Perempuan", flag: "🇮🇩" },
];

function StatusDot({ status }: { status: HistoryItem["status"] }) {
  if (status === "done") return <span className="text-green-400 text-xs">✓</span>;
  if (status === "rendering") return <span className="animate-pulse text-yellow-400 text-xs">⟳</span>;
  return <span className="text-red-400 text-xs">✗</span>;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState("");
  const [template, setTemplate] = useState("5-tips");
  const [voice, setVoice] = useState("pNInz6obpgDQGcFmaJgB");
  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<SceneData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [actionSteps, setActionSteps] = useState<{name:string;status:string;conclusion:string|null}[]>([]);
  const [actionHtmlUrl, setActionHtmlUrl] = useState<string | null>(null);
  const [cancelingRun, setCancelingRun] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [elVoices, setElVoices] = useState<ELVoice[]>(EL_VOICES_FALLBACK);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("vf_history");
    if (saved) setHistory(JSON.parse(saved));
    // Load ElevenLabs voices
    fetch("/api/voices").then(r => r.json()).then(d => {
      if (d.voices?.length > 0) {
        setElVoices(d.voices);
        setVoice(d.voices[0].id);
      }
    }).catch(() => {});
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("vf_history", JSON.stringify(items));
  };

  const newVideo = () => {
    setStep("idle"); setTopic(""); setPreview(null);
    setVideoUrl(null); setError(null); setActiveId(null);
  };

  const selectHistory = (item: HistoryItem) => {
    setActiveId(item.id);
    if (item.status === "done" && item.videoUrl) {
      setVideoUrl(item.videoUrl); setStep("done"); setPreview(null);
    } else if (item.status === "rendering") {
      setStep("rendering"); setVideoUrl(null);
      if (item.runId) pollStatus(item.id, item.runId);
    } else {
      setStep("error"); setError("Render gagal sebelumnya."); setVideoUrl(null);
    }
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const res = await fetch("/api/trends");
      const data = await res.json();
      const topics: string[] = data.topics ?? [];
      setTrendTopics(topics);
      if (topics.length > 0 && !topic.trim()) setTopic(topics[0]);
    } catch { /* ignore */ }
    setLoadingTrends(false);
  };

  const playVoicePreview = async (voiceId: string, previewUrl?: string | null) => {
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    setPlayingVoice(voiceId);
    try {
      let url: string;
      if (previewUrl) {
        // Use ElevenLabs hosted preview directly — instant, no API cost
        url = previewUrl;
      } else {
        const res = await fetch("/api/voice-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId }),
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
      }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingVoice(null);
      audio.onerror = () => setPlayingVoice(null);
    } catch {
      setPlayingVoice(null);
    }
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating"); setError(null); setPreview(null); setVideoUrl(null);
    const id = Date.now().toString();
    setActiveId(id);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, template }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: SceneData = await res.json();
      setPreview(data);

      const newItem: HistoryItem = { id, title: data.videoTitle, status: "rendering", accent: data.accent, createdAt: new Date().toISOString() };
      const updated = [newItem, ...history];
      saveHistory(updated);

      setStep("rendering");
      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, voice }),
      });
      if (!renderRes.ok) throw new Error(await renderRes.text());
      const { runId } = await renderRes.json();

      saveHistory(updated.map((h) => (h.id === id ? { ...h, runId } : h)));
      pollStatus(id, runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi error");
      setStep("error");
      setHistory((prev) => {
        const updated = prev.map((h) => (h.id === id ? { ...h, status: "failed" as const } : h));
        localStorage.setItem("vf_history", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const pollActionLogs = async (runId: number) => {
    try {
      const res = await fetch(`/api/actions?runId=${runId}`);
      const data = await res.json();
      if (data.steps) setActionSteps(data.steps);
      if (data.htmlUrl) setActionHtmlUrl(data.htmlUrl);
    } catch { /* ignore */ }
  };

  const cancelAction = async (runId: number, histId: string) => {
    if (!confirm("Cancel GitHub Action run ini?")) return;
    setCancelingRun(true);
    await fetch("/api/actions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    setError("Run dibatalkan.");
    setStep("error");
    setHistory((prev) => {
      const updated = prev.map((h) => h.id === histId ? { ...h, status: "failed" as const } : h);
      localStorage.setItem("vf_history", JSON.stringify(updated));
      return updated;
    });
    setCancelingRun(false);
  };

  const pollStatus = (id: string, runId: number) => {
    pollActionLogs(runId);
    const poll = async () => {
      const res = await fetch(`/api/status?runId=${runId}`);
      const data = await res.json();
      pollActionLogs(runId);
      if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl); setStep("done");
        setHistory((prev) => {
          const updated = prev.map((h) => h.id === id ? { ...h, status: "done" as const, videoUrl: data.videoUrl } : h);
          localStorage.setItem("vf_history", JSON.stringify(updated));
          return updated;
        });
      } else if (data.status === "failed") {
        setError("Render gagal. Cek GitHub Actions untuk detail."); setStep("error");
        setHistory((prev) => {
          const updated = prev.map((h) => (h.id === id ? { ...h, status: "failed" as const } : h));
          localStorage.setItem("vf_history", JSON.stringify(updated));
          return updated;
        });
      } else { setTimeout(poll, 15000); }
    };
    setTimeout(poll, 20000);
    // Refresh logs every 15s
    const logsInterval = setInterval(() => pollActionLogs(runId), 15000);
    setTimeout(() => clearInterval(logsInterval), 30 * 60 * 1000);
  };

  const activeItem = history.find((h) => h.id === activeId);
  const selectedTemplate = TEMPLATES.find((t) => t.id === template)!;

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-base font-black text-white">Video Factory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Dev shorts generator</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 pt-3">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white bg-zinc-800 font-medium">
            <span>🎬</span> Generate
          </Link>
          <Link href="/results" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🎥</span> Results
          </Link>
          <Link href="/analytics" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>📊</span> Analytics
          </Link>
        </nav>
        <div className="px-3 pt-3 pb-1">
          <button onClick={newVideo} className="w-full rounded-lg py-2 px-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2">
            <span>+</span> New Video
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 mt-2">
          {history.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center mt-6">Belum ada video.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-1">History</p>
              {history.map((item) => (
                <button key={item.id} onClick={() => selectHistory(item)}
                  className="w-full text-left rounded-lg px-3 py-2 text-xs transition-all flex items-start gap-2"
                  style={{ background: activeId === item.id ? `${item.accent}20` : "transparent", borderLeft: activeId === item.id ? `2px solid ${item.accent}` : "2px solid transparent", color: activeId === item.id ? "white" : "#a1a1aa" }}>
                  <StatusDot status={item.status} />
                  <span className="truncate flex-1">{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">

          {/* ── Idle form ── */}
          {step === "idle" && (
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Buat video baru</h2>
                <p className="text-zinc-500 text-sm">Pilih template, tulis topik, pilih voice — selesai.</p>
              </div>

              {/* Template grid with layout previews */}
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-3">Template & Layout</p>
                <div className="grid grid-cols-3 gap-4">
                  {TEMPLATES.map((t) => {
                    const LayoutPreview = LAYOUT_PREVIEWS[t.layout];
                    const isSelected = template === t.id;
                    return (
                      <button key={t.id} onClick={() => setTemplate(t.id)}
                        className="text-left rounded-xl border transition-all overflow-hidden flex flex-col"
                        style={{ borderColor: isSelected ? t.color : "#27272a", background: isSelected ? `${t.color}10` : "#18181b" }}>
                        {/* Layout preview (9:16 mini) */}
                        <div style={{ width: "100%", aspectRatio: "9/16", maxHeight: 180, position: "relative", background: "#0a0a0a" }}>
                          <LayoutPreview color={t.color} />
                          {isSelected && (
                            <div style={{ position: "absolute", top: 8, right: 8, background: t.color, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 900 }}>✓</div>
                          )}
                          <div style={{ position: "absolute", bottom: 6, left: 6, background: "#00000088", borderRadius: 4, padding: "2px 6px", fontSize: 9, color: "#a1a1aa", backdropFilter: "blur(4px)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {t.layout}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-sm font-bold text-white flex items-center gap-1.5 mb-0.5">
                            <span>{t.emoji}</span> {t.label}
                          </p>
                          <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic + Trending */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-zinc-300">Topik</p>
                  <button onClick={fetchTrends} disabled={loadingTrends}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50">
                    {loadingTrends ? "..." : "🔥 Trending Topics"}
                  </button>
                </div>
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  rows={2}
                  placeholder={`Contoh: ${selectedTemplate.label === "5 Tips Praktis" ? "5 Git commands yang jarang diketahui" : selectedTemplate.label === "Explained" ? "Apa itu Docker dan kenapa harus dipakai" : "5 kesalahan umum waktu belajar JavaScript"}`}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                {/* Trending suggestions */}
                {trendTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trendTopics.map((t, i) => (
                      <button key={i} onClick={() => setTopic(t)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-left">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Voice */}
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-3">Voice</p>

                {/* ElevenLabs voices */}
                <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2">ElevenLabs (Recommended)</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {elVoices.map((v) => {
                    const isSelected = voice === v.id;
                    const isPlaying = playingVoice === v.id;
                    return (
                      <div key={v.id} onClick={() => setVoice(v.id)}
                        className="flex items-center gap-2 rounded-xl px-4 py-3 border transition-all cursor-pointer"
                        style={{ borderColor: isSelected ? "#6366f1" : "#3f3f46", background: isSelected ? "#6366f115" : "#18181b" }}>
                        <div className="flex flex-col items-start">
                          <p className="text-xs text-zinc-500">🇺🇸 {v.desc}</p>
                          <p className="font-bold text-sm text-white">{v.label}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); playVoicePreview(v.id, v.previewUrl); }}
                          className="ml-1 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: isPlaying ? "#6366f1" : "#27272a" }}
                          title="Preview suara">
                          <span style={{ fontSize: 11 }}>{isPlaying ? "⏸" : "▶"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Free voices */}
                <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2">Edge TTS (Free · No API)</p>
                <div className="flex gap-2 flex-wrap">
                  {FREE_VOICES.map((v) => {
                    const isSelected = voice === v.id;
                    return (
                      <button key={v.id} onClick={() => setVoice(v.id)}
                        className="flex flex-col items-start rounded-xl px-4 py-3 border transition-all"
                        style={{ borderColor: isSelected ? "#6366f1" : "#3f3f46", background: isSelected ? "#6366f115" : "#18181b" }}>
                        <p className="text-xs text-zinc-500">{v.flag} {v.desc}</p>
                        <p className="font-bold text-sm text-white">{v.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={generate} disabled={!topic.trim()}
                className="rounded-xl py-3.5 font-black text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: selectedTemplate.color, boxShadow: `0 6px 24px ${selectedTemplate.color}44` }}>
                {selectedTemplate.emoji} Generate Video →
              </button>
            </div>
          )}

          {/* ── Generating ── */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-white font-bold text-lg">Generating script dengan AI...</p>
              <p className="text-zinc-500 text-sm">Biasanya 5–15 detik</p>
            </div>
          )}

          {/* ── Rendering ── */}
          {step === "rendering" && (
            <div className="flex gap-6 w-full">
              {/* Left: script preview */}
              {preview && (
                <div className="flex-1 rounded-2xl p-5 border self-start" style={{ background: `${preview.accent}10`, borderColor: `${preview.accent}30` }}>
                  <p className="font-black text-white text-lg mb-1">{preview.introEmoji} {preview.videoTitle}</p>
                  <p className="text-zinc-400 text-sm mb-4">{preview.subtitle}</p>
                  <div className="flex flex-col gap-2">
                    {preview.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">{tip.emoji}</span>
                        <div>
                          <p className="text-white text-sm font-semibold">{tip.title}</p>
                          <p className="text-zinc-500 text-xs">{tip.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right: GitHub Actions log */}
              <div className="flex-1 flex flex-col gap-3 self-start">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">GitHub Actions sedang berjalan</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Estimasi 5–8 menit · Refresh otomatis tiap 15 detik</p>
                  </div>
                  {activeId && history.find(h => h.id === activeId)?.runId && (
                    <button
                      onClick={() => { const h = history.find(x => x.id === activeId); if (h?.runId) cancelAction(h.runId, activeId); }}
                      disabled={cancelingRun}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400 hover:text-red-200 transition-colors disabled:opacity-50">
                      {cancelingRun ? "..." : "Cancel"}
                    </button>
                  )}
                </div>

                {/* Steps */}
                {actionSteps.length > 0 && (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Steps</p>
                      {actionHtmlUrl && (
                        <a href={actionHtmlUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                          Full logs →
                        </a>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {actionSteps.filter(s => s.name !== "Set up job" && s.name !== "Complete job").map((s, i) => {
                        const icon = s.conclusion === "success" ? "✓" : s.conclusion === "failure" ? "✗" : s.status === "in_progress" ? "⟳" : "○";
                        const color = s.conclusion === "success" ? "#22c55e" : s.conclusion === "failure" ? "#ef4444" : s.status === "in_progress" ? "#eab308" : "#52525b";
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <span style={{ color, fontSize: 13, width: 14, flexShrink: 0 }} className={s.status === "in_progress" ? "animate-spin" : ""}>{icon}</span>
                            <span className="text-sm text-zinc-300">{s.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && videoUrl && (
            <div className="flex gap-8 items-start">
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black flex-shrink-0" style={{ width: 280, aspectRatio: "9/16" }}>
                <video src={videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-2xl font-black text-white">{activeItem?.title ?? preview?.videoTitle}</p>
                  <p className="text-green-400 text-sm mt-1 font-medium">✓ Render selesai</p>
                </div>
                <a href={videoUrl} download="video.mp4"
                  className="rounded-xl py-3 px-6 font-black text-white text-center text-sm inline-block w-fit"
                  style={{ background: activeItem?.accent ?? "#6366f1", boxShadow: `0 6px 20px ${activeItem?.accent ?? "#6366f1"}55` }}>
                  Download MP4
                </a>
                <button onClick={newVideo} className="rounded-xl py-3 px-6 font-bold text-zinc-300 text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors w-fit">
                  + Buat video baru
                </button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
              <div className="text-4xl">❌</div>
              <p className="text-red-400 font-medium">{error}</p>
              <button onClick={newVideo} className="rounded-xl py-2.5 px-8 font-bold text-white text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors">
                Coba lagi
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
