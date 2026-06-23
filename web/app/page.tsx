"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";

type Step = "idle" | "generating" | "rendering" | "done" | "error";
type HistoryItem = {
  id: string; title: string; status: "done" | "rendering" | "failed";
  videoUrl?: string; thumbnailUrl?: string; runId?: number; accent: string; createdAt: string;
  caption?: string; hashtags?: string[];
  tiktokUrl?: string; instagramUrl?: string;
  autoTikTok?: boolean; autoInstagram?: boolean; igShareToFeed?: boolean;
};
type SceneData = {
  videoTitle: string; subtitle: string; introEmoji: string; accent: string;
  tips: { title: string; subtitle: string; emoji: string }[];
  ctaText: string; scenes: { id: string; text: string }[]; layout?: string;
  caption?: string; hashtags?: string[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────


const VOICES = [
  { id: "id-ID-ArdiNeural", label: "Ardi", desc: "Indo · Male", flag: "🇮🇩" },
  { id: "id-ID-GadisNeural", label: "Gadis", desc: "Indo · Female", flag: "🇮🇩" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex-shrink-0 transition-colors duration-200 rounded-full focus:outline-none"
      style={{ width: 44, height: 24, background: on ? "#00AEEF" : "#3f3f46" }}
    >
      <span
        className="absolute top-0.5 left-0.5 rounded-full bg-white transition-transform duration-200"
        style={{ width: 20, height: 20, transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}


// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(true);
  const [voice, setVoice] = useState("id-ID-ArdiNeural");
  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<SceneData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [actionSteps, setActionSteps] = useState<{ name: string; status: string; conclusion: string | null }[]>([]);
  const [actionHtmlUrl, setActionHtmlUrl] = useState<string | null>(null);
  const [renderFrame, setRenderFrame] = useState<number | null>(null);
  const [renderTotal, setRenderTotal] = useState<number | null>(null);
  const [cancelingRun, setCancelingRun] = useState(false);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [autoTikTok, setAutoTikTok] = useState(false);
  const [autoInstagram, setAutoInstagram] = useState(false);
  const [igShareToFeed, setIgShareToFeed] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [watermarkHandle, setWatermarkHandle] = useState("");
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [publishing, setPublishing] = useState<"tiktok" | "instagram" | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResetMemory, setShowResetMemory] = useState(false);
  const [resettingMemory, setResettingMemory] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const saveWatermark = async (handle: string, logoUrl: string | null) => {
    await fetch("/api/watermark", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, logoUrl }),
    }).catch(() => {});
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-logo", { method: "POST", body: form });
      const { url } = await res.json();
      setWatermarkLogoUrl(url);
      await saveWatermark(watermarkHandle, url);
    } catch { /* ignore */ }
    setUploadingLogo(false);
  };

  useEffect(() => {
    // Load watermark dari Blob
    fetch("/api/watermark").then(r => r.json()).then(d => {
      if (d.handle) setWatermarkHandle(d.handle);
      if (d.logoUrl) setWatermarkLogoUrl(d.logoUrl);
    }).catch(() => {});

    const saved: HistoryItem[] = JSON.parse(localStorage.getItem("vf_history") ?? "[]");
    if (saved.length) setHistory(saved);

    // Auto-resume polling untuk item yang masih rendering
    const inProgress = saved.filter(h => h.status === "rendering" && h.runId);
    if (inProgress.length > 0) {
      const latest = inProgress[0];
      setActiveId(latest.id);
      setStep("rendering");
      pollStatus(latest.id, latest.runId!);
    }

  }, []); // ponytail: eslint-disable-line — pollStatus stabil, tidak perlu di deps

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


  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating"); setError(null); setPreview(null); setVideoUrl(null);
    const id = Date.now().toString();
    setActiveId(id);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, useKnowledge }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: SceneData = await res.json();
      setPreview(data);
      const newItem: HistoryItem = { id, title: data.videoTitle, status: "rendering", accent: data.accent, createdAt: new Date().toISOString(), caption: data.caption, hashtags: data.hashtags, autoTikTok, autoInstagram, igShareToFeed };
      const updated = [newItem, ...history];
      saveHistory(updated);
      setStep("rendering");
      const renderRes = await fetch("/api/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, voice, watermarkHandle, watermarkLogoUrl }),
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
      if (data.renderFrame != null) setRenderFrame(data.renderFrame);
      if (data.renderTotal != null) setRenderTotal(data.renderTotal);
    } catch { /* ignore */ }
  };

  const cancelAction = async (runId: number, histId: string) => {
    if (!confirm("Cancel GitHub Action run ini?")) return;
    setCancelingRun(true);
    await fetch("/api/actions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId }) });
    setError("Run dibatalkan."); setStep("error");
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
        let doneItem: HistoryItem | undefined;
        setHistory((prev) => {
          const updated = prev.map((h) => h.id === id ? { ...h, status: "done" as const, videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl ?? h.thumbnailUrl } : h);
          doneItem = updated.find((h) => h.id === id);
          localStorage.setItem("vf_history", JSON.stringify(updated));
          return updated;
        });
        // Auto-upload kalau preferensi tersimpan di item (bukan state global,
        // biar tetap jalan walau halaman di-resume / di-mount ulang)
        if (doneItem) {
          if (doneItem.autoTikTok && !doneItem.tiktokUrl) publish("tiktok", doneItem);
          if (doneItem.autoInstagram && !doneItem.instagramUrl) publish("instagram", doneItem);
        }
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
    const logsInterval = setInterval(() => pollActionLogs(runId), 15000);
    setTimeout(() => clearInterval(logsInterval), 30 * 60 * 1000);
  };

  const activeItem = history.find((h) => h.id === activeId);

  const captionText = (item?: HistoryItem) => {
    if (!item?.caption) return "";
    const tags = (item.hashtags ?? []).map(h => `#${h.replace(/^#/, "")}`).join(" ");
    return tags ? `${item.caption}\n\n${tags}` : item.caption;
  };

  const copyCaption = async (item: HistoryItem) => {
    await navigator.clipboard.writeText(captionText(item)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const publish = async (platform: "tiktok" | "instagram", item: HistoryItem) => {
    if (!item.videoUrl) return;
    setPublishing(platform);
    try {
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, videoUrl: item.videoUrl, caption: captionText(item), thumbnailUrl: item.thumbnailUrl, igShareToFeed: item.igShareToFeed ?? true }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Upload gagal"); return; }
      const key = platform === "tiktok" ? "tiktokUrl" : "instagramUrl";
      setHistory((prev) => {
        const updated = prev.map((h) => h.id === item.id ? { ...h, [key]: d.postUrl ?? "uploaded" } : h);
        localStorage.setItem("vf_history", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setPublishing(null);
    }
  };

  const resetMemory = async () => {
    setResettingMemory(true);
    await fetch("/api/memory", { method: "DELETE" }).catch(() => {});
    setResettingMemory(false);
    setShowResetMemory(false);
  };

  const selectedVoiceLabel = VOICES.find(v => v.id === voice)?.label ?? "Pilih Voice";
  const accentColor = "#00AEEF";

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">

      <Sidebar history={history} />

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">

        {/* ── Idle / Form ── */}
        {step === "idle" && (
          <div className="max-w-2xl mx-auto px-8 py-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white leading-tight">
                Buat <span style={{ color: "#00AEEF" }}>video pendek</span> viral<br />secara otomatis
              </h2>
              <p className="text-zinc-500 text-sm mt-2">Ketik topik, klik generate — AI pilih template & warna otomatis.</p>
            </div>

            {/* ── Input Card ── */}
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>

              {/* Topic input */}
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 flex-shrink-0 text-zinc-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <textarea
                    className="flex-1 bg-transparent text-white placeholder-zinc-600 resize-none focus:outline-none text-sm leading-relaxed"
                    rows={2}
                    placeholder="Ketik topik video kamu… misal: 5 Git commands yang jarang diketahui developer"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
                  />
                </div>
                {/* Trending chips */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={fetchTrends} disabled={loadingTrends}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-colors disabled:opacity-40">
                    {loadingTrends
                      ? <span className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      : "🔥"}
                    Trending
                  </button>
                  {trendTopics.map((t, i) => (
                    <button key={i} onClick={() => setTopic(t)}
                      className="text-xs px-2.5 py-1 rounded-md border border-white/[0.06] text-zinc-500 hover:text-zinc-200 hover:border-white/20 transition-colors text-left truncate max-w-[200px]">
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Knowledge toggle */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Ikut Knowledge Creavoo</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{useKnowledge ? "Konten berdasarkan produk & tone Creavoo" : "Konten digital bebas, tidak terikat Creavoo"}</p>
                  </div>
                  <Toggle on={useKnowledge} onToggle={() => setUseKnowledge(v => !v)} />
                </div>
              </div>

              {/* Voice row */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">Voice</p>
                    <p className="text-sm font-medium text-zinc-300">{selectedVoiceLabel}</p>
                  </div>
                  <button onClick={() => setShowVoice(v => !v)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-500 hover:text-zinc-200 transition-colors">
                    {showVoice ? "Tutup ▲" : "Ganti ▼"}
                  </button>
                </div>
                {showVoice && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {VOICES.map((v) => (
                      <button key={v.id} onClick={() => setVoice(v.id)}
                        className="px-4 py-2.5 rounded-xl border text-left transition-all"
                        style={{ borderColor: voice === v.id ? "#00AEEF" : "transparent", background: voice === v.id ? "#00AEEF15" : "#ffffff07" }}>
                        <p className="text-[10px] text-zinc-500">{v.flag} {v.desc}</p>
                        <p className="text-sm font-bold">{v.label}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Watermark */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Watermark</p>
                <div className="flex flex-col gap-4">
                  {/* Controls row */}
                  <div className="flex gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    {/* Logo upload */}
                    <button onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/20 transition-colors w-full text-left"
                      style={{ background: "#ffffff07" }}>
                      <div className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "#0a0a0a" }}>
                        {uploadingLogo ? (
                          <span className="w-3.5 h-3.5 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                        ) : watermarkLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={watermarkLogoUrl} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-300">{watermarkLogoUrl ? "Logo terupload ✓" : "Upload Logo"}</p>
                        <p className="text-[10px] text-zinc-600">PNG/JPG · pojok kiri atas</p>
                      </div>
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />

                    {/* Handle input */}
                    <input
                      type="text"
                      value={watermarkHandle}
                      onChange={(e) => { setWatermarkHandle(e.target.value); saveWatermark(e.target.value, watermarkLogoUrl); }}
                      placeholder="@yourhandle"
                      className="w-full bg-transparent border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <p className="text-[10px] text-zinc-700 px-1">Handle muncul di pojok kanan atas video</p>
                  </div>
                  </div>{/* end controls row */}

                  {/* Phone preview — full width, centered */}
                  <div className="flex justify-center">
                    <div className="rounded-3xl overflow-hidden border border-white/[0.1] relative"
                      style={{ width: 220, height: 390, background: "#0a0a0a", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                      {/* gradient bg */}
                      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 40%, ${accentColor}40 0%, transparent 65%)` }} />

                      {/* top bar sim */}
                      <div className="absolute top-0 inset-x-0 h-7 flex items-center justify-center">
                        <div className="w-16 h-1 rounded-full bg-white/10" />
                      </div>

                      {/* top-left: logo */}
                      <div className="absolute top-10 left-4 flex items-center gap-2 bg-black/55 rounded-full px-3 py-2" style={{ backdropFilter: "blur(8px)" }}>
                        {watermarkLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={watermarkLogoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-700 border border-white/10 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                        )}
                      </div>

                      {/* top-right: handle */}
                      <div className="absolute top-10 right-4 bg-black/55 rounded-full px-3 py-2" style={{ backdropFilter: "blur(8px)" }}>
                        <p className="text-white font-bold text-sm">
                          {watermarkHandle || "@handle"}
                        </p>
                      </div>

                      {/* content placeholder */}
                      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 items-center">
                        <div className="text-3xl">🎬</div>
                        <div className="h-3 bg-white/20 rounded-full w-full" />
                        <div className="h-2 bg-white/10 rounded-full w-4/5" />
                        <div className="h-2 bg-white/07 rounded-full w-3/5" />
                      </div>

                      {/* bottom bar sim */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <div className="w-24 h-1 rounded-full bg-white/15" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-upload toggles */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col gap-3">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Auto Upload</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎵</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">TikTok</p>
                      <p className="text-[11px] text-zinc-600">Upload otomatis setelah render selesai</p>
                    </div>
                  </div>
                  <Toggle on={autoTikTok} onToggle={() => setAutoTikTok(v => !v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📸</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Instagram Reels</p>
                      <p className="text-[11px] text-zinc-600">Upload otomatis setelah render selesai</p>
                    </div>
                  </div>
                  <Toggle on={autoInstagram} onToggle={() => setAutoInstagram(v => !v)} />
                </div>
                <div className="flex items-center justify-between pl-8">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Tampil di grid / feed profil</p>
                    <p className="text-[11px] text-zinc-600">{igShareToFeed ? "Reels muncul di feed & tab Reels" : "Hanya di tab Reels"}</p>
                  </div>
                  <Toggle on={igShareToFeed} onToggle={() => setIgShareToFeed(v => !v)} />
                </div>
              </div>

              {/* Generate button */}
              <div className="p-5 flex flex-col gap-2">
                <button onClick={generate} disabled={!topic.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: topic.trim() ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : "#27272a",
                    boxShadow: topic.trim() ? `0 4px 20px ${accentColor}50` : "none",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Generate video sekarang
                  <span className="text-xs opacity-60 ml-1 font-normal hidden sm:inline">⌘↵</span>
                </button>
                <button onClick={() => setShowResetMemory(true)}
                  className="w-full py-2 rounded-xl text-xs text-zinc-600 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/40">
                  🗑 Reset memory AI
                </button>
              </div>
            </div>
          </div>

        )}

        {/* ── Generating ── */}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
            <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }} />
            <div>
              <p className="text-white font-bold text-lg">AI sedang menulis script…</p>
              <p className="text-zinc-500 text-sm mt-1">Biasanya 5–15 detik</p>
            </div>
          </div>
        )}

        {/* ── Rendering ── */}
        {step === "rendering" && (
          <div className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-5">
            {/* Status bar */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05]">
              <div className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">GitHub Actions sedang render…</p>
                <p className="text-zinc-500 text-xs mt-0.5">Estimasi 5–8 menit · Update tiap 15 detik</p>
              </div>
              {activeId && history.find(h => h.id === activeId)?.runId && (
                <button
                  onClick={() => { const h = history.find(x => x.id === activeId); if (h?.runId) cancelAction(h.runId, activeId!); }}
                  disabled={cancelingRun}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-800/50 text-red-400 hover:text-red-200 transition-colors disabled:opacity-50">
                  {cancelingRun ? "…" : "Cancel"}
                </button>
              )}
            </div>

            <div className="flex gap-5">
              {/* Script preview */}
              {preview && (
                <div className="flex-1 rounded-2xl p-5 border self-start" style={{ background: `${preview.accent}08`, borderColor: `${preview.accent}25` }}>
                  <p className="font-black text-white text-base mb-0.5">{preview.introEmoji} {preview.videoTitle}</p>
                  <p className="text-zinc-500 text-xs mb-4">{preview.subtitle}</p>
                  <div className="flex flex-col gap-2.5">
                    {preview.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-base flex-shrink-0">{tip.emoji}</span>
                        <div>
                          <p className="text-white text-xs font-semibold">{tip.title}</p>
                          <p className="text-zinc-600 text-[11px] mt-0.5">{tip.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action steps */}
              {actionSteps.length > 0 && (
                <div className="flex-1 rounded-2xl border border-white/[0.06] overflow-hidden self-start" style={{ background: "#111113" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Steps</p>
                    {actionHtmlUrl && (
                      <a href={actionHtmlUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">Full logs →</a>
                    )}
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {actionSteps.filter(s => s.name !== "Set up job" && s.name !== "Complete job").map((s, i) => {
                      const isDone = s.conclusion === "success";
                      const isFail = s.conclusion === "failure";
                      const isActive = s.status === "in_progress";
                      const isRenderStep = s.name === "Render video with Remotion";
                      const frameProgress = isRenderStep && renderTotal ? (renderFrame ?? 0) / renderTotal : null;
                      return (
                        <div key={i} className="px-4 py-2.5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-3">
                            {/* icon */}
                            <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                              {isDone && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                              {isFail && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                              {isActive && <span className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin block"/>}
                              {!isDone && !isFail && !isActive && <span className="w-2 h-2 rounded-full bg-zinc-700 block mx-auto"/>}
                            </span>
                            <span className={`text-xs flex-1 ${isDone ? "text-zinc-500" : isActive ? "text-white font-medium" : "text-zinc-500"}`}>{s.name}</span>
                            {/* frame counter */}
                            {isRenderStep && renderFrame != null && renderTotal != null && (
                              <span className="text-[10px] text-zinc-500 font-mono tabular-nums flex-shrink-0">{renderFrame}/{renderTotal}</span>
                            )}
                          </div>
                          {/* render progress bar */}
                          {isRenderStep && frameProgress != null && (
                            <div className="ml-[26px] h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(frameProgress * 100, 100).toFixed(1)}%`, background: "#eab308" }} />
                            </div>
                          )}
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
          <div className="max-w-3xl mx-auto px-8 py-10 flex gap-8 items-start">
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black flex-shrink-0" style={{ width: 240, aspectRatio: "9/16" }}>
              <video src={videoUrl} controls className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col gap-5 flex-1 pt-2">
              <div>
                <p className="text-2xl font-black text-white leading-tight">{activeItem?.title ?? preview?.videoTitle}</p>
                <p className="text-green-400 text-sm mt-2 font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  Render selesai
                </p>
              </div>
              <a href={videoUrl} download="video.mp4"
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white text-sm w-fit transition-all"
                style={{ background: activeItem?.accent ?? "#6366f1", boxShadow: `0 4px 20px ${activeItem?.accent ?? "#6366f1"}50` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download MP4
              </a>
              {/* Upload ke platform */}
              <div className="flex gap-3">
                {/* TikTok */}
                {activeItem?.tiktokUrl ? (
                  <a href={activeItem.tiktokUrl !== "uploaded" ? activeItem.tiktokUrl : undefined} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm border border-green-800/40 text-green-400 transition-colors w-fit"
                    style={{ background: "#111113" }}>
                    🎵 Lihat di TikTok ↗
                  </a>
                ) : (
                  <button onClick={() => activeItem && publish("tiktok", activeItem)} disabled={publishing !== null}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-zinc-300 text-sm border border-white/[0.06] hover:border-white/20 transition-colors w-fit disabled:opacity-50"
                    style={{ background: "#111113" }}>
                    {publishing === "tiktok" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "🎵"}
                    Upload TikTok
                  </button>
                )}
                {/* Instagram */}
                {activeItem?.instagramUrl ? (
                  <a href={activeItem.instagramUrl !== "uploaded" ? activeItem.instagramUrl : undefined} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm border border-green-800/40 text-green-400 transition-colors w-fit"
                    style={{ background: "#111113" }}>
                    📸 Lihat di Instagram ↗
                  </a>
                ) : (
                  <button onClick={() => activeItem && publish("instagram", activeItem)} disabled={publishing !== null}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-zinc-300 text-sm border border-white/[0.06] hover:border-white/20 transition-colors w-fit disabled:opacity-50"
                    style={{ background: "#111113" }}>
                    {publishing === "instagram" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "📸"}
                    Upload Instagram
                  </button>
                )}
              </div>

              {/* Caption + hashtag */}
              {activeItem?.caption && (
                <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "#111113" }}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Caption & Hashtag</p>
                    <button onClick={() => activeItem && copyCaption(activeItem)}
                      className="text-xs px-3 py-1 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition-colors">
                      {copied ? "✓ Tersalin" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{activeItem.caption}</p>
                    {activeItem.hashtags && activeItem.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activeItem.hashtags.map((h, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400">#{h.replace(/^#/, "")}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button onClick={newVideo}
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-zinc-400 text-sm border border-white/[0.06] hover:text-white hover:border-white/20 transition-colors w-fit"
                style={{ background: "#111113" }}>
                + Buat video baru
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-xl">❌</div>
            <div>
              <p className="text-red-400 font-medium text-sm">{error}</p>
            </div>
            <button onClick={newVideo}
              className="py-2.5 px-8 rounded-xl font-semibold text-white text-sm border border-white/[0.06] hover:border-white/20 transition-colors"
              style={{ background: "#111113" }}>
              Coba lagi
            </button>
          </div>
        )}

      </main>

      {/* Modal konfirmasi reset memory */}
      {showResetMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="rounded-2xl border border-white/[0.08] p-6 flex flex-col gap-4 max-w-sm w-full" style={{ background: "#111113" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-xl flex-shrink-0">⚠️</div>
              <div>
                <p className="text-white font-bold text-sm">Reset Memory AI?</p>
                <p className="text-zinc-500 text-xs mt-0.5">AI tidak akan ingat topik yang sudah pernah dibuat.</p>
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed border border-white/[0.06] rounded-xl p-3" style={{ background: "#0a0a0a" }}>
              Memory digunakan supaya AI tidak bikin video dengan topik yang sama berulang. Kalau di-reset, AI bisa saja mengulang topik lama di video berikutnya.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetMemory(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 border border-white/[0.06] hover:text-white transition-colors"
                style={{ background: "#0a0a0a" }}>
                Batal
              </button>
              <button onClick={resetMemory} disabled={resettingMemory}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#ef4444", boxShadow: "0 4px 16px #ef444440" }}>
                {resettingMemory ? "Menghapus…" : "Ya, reset memory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
