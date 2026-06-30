"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import { Sk, SkeletonStyle } from "./components/Skeleton";

type Step = "idle" | "generating" | "rendering" | "done" | "error";
type HistoryItem = {
  id: string; title: string; status: "done" | "rendering" | "failed";
  videoUrl?: string; thumbnailUrl?: string; runId?: number; accent: string; createdAt: string;
  caption?: string; hashtags?: string[];
  tiktokUrl?: string; instagramUrl?: string;
  autoTikTok?: boolean; autoInstagram?: boolean; igShareToFeed?: boolean;
  profile?: string;
};
type SceneData = {
  videoTitle: string; subtitle: string; introEmoji: string; accent: string;
  tips: { title: string; subtitle: string; emoji: string }[];
  ctaText: string; scenes: { id: string; text: string }[]; layout?: string;
  caption?: string; hashtags?: string[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROFILES = [
  { id: "creavoo", label: "Creavoo", color: "#00AEEF" },
  { id: "zaportfolio", label: "Zaportfolio", color: "#6366f1" },
];

const CONTENT_THEMES = [
  { id: "it-developer", label: "IT Developer", emoji: "💻" },
  { id: "ai",           label: "AI",           emoji: "🤖" },
  { id: "design",       label: "Design",       emoji: "🎨" },
  { id: "tips-trick",   label: "Tips & Trick", emoji: "⚡" },
];

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
  const [activeProfile, setActiveProfile] = useState("creavoo");
  const [contentTheme, setContentTheme] = useState("it-developer");
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
  const [loadingWatermark, setLoadingWatermark] = useState(true);
  const [publishing, setPublishing] = useState<"tiktok" | "instagram" | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResetMemory, setShowResetMemory] = useState(false);
  const [resettingMemory, setResettingMemory] = useState(false);
  const [genLogs, setGenLogs] = useState<{ ts: number; msg: string; type: "info" | "ok" | "error" }[]>([]);
  const genLogsRef = useRef<typeof genLogs>([]);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const pollCleanupRef = useRef<{ timeout: ReturnType<typeof setTimeout> | null; interval: ReturnType<typeof setInterval> | null }>({ timeout: null, interval: null });

  useEffect(() => {
    return () => {
      if (pollCleanupRef.current.timeout) clearTimeout(pollCleanupRef.current.timeout);
      if (pollCleanupRef.current.interval) clearInterval(pollCleanupRef.current.interval);
    };
  }, []);

  const saveWatermark = async (handle: string, logoUrl: string | null, profile = activeProfile) => {
    await fetch(`/api/watermark?profile=${profile}`, {
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
    const stored = localStorage.getItem("vf_profile");
    if (stored === "zaportfolio") setActiveProfile("zaportfolio");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingWatermark(true);
    fetch(`/api/watermark?profile=${activeProfile}`, { signal: controller.signal })
      .then(r => r.json()).then(d => {
        setWatermarkHandle(d.handle ?? "");
        setWatermarkLogoUrl(d.logoUrl ?? null);
      }).catch(() => {}).finally(() => setLoadingWatermark(false));
    return () => controller.abort();
  }, [activeProfile]); // eslint-disable-line

  useEffect(() => {
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
  }, []); // eslint-disable-line

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
      const params = new URLSearchParams({ profile: activeProfile });
      if (activeProfile === "zaportfolio") params.set("contentTheme", contentTheme);
      const res = await fetch(`/api/trends?${params}`);
      const data = await res.json();
      const topics: string[] = data.topics ?? [];
      setTrendTopics(topics);
      if (topics.length > 0 && !topic.trim()) setTopic(topics[0]);
    } catch { /* ignore */ }
    setLoadingTrends(false);
  };


  const addLog = (msg: string, type: "info" | "ok" | "error" = "info") => {
    const entry = { ts: Date.now(), msg, type };
    genLogsRef.current = [...genLogsRef.current, entry];
    setGenLogs([...genLogsRef.current]);
  };

  const generate = async () => {
    if (!topic.trim()) return;
    genLogsRef.current = [];
    setGenLogs([]);
    setStep("generating"); setError(null); setPreview(null); setVideoUrl(null);
    const id = Date.now().toString();
    setActiveId(id);
    const t0 = Date.now();
    try {
      addLog("Memulai generate…");
      addLog(`Topik: "${topic}"`);
      if (activeProfile === "creavoo" && useKnowledge) addLog("Memuat knowledge base Creavoo…");
      addLog("Mengambil memory topik sebelumnya…");
      addLog("Mengirim ke AI untuk menulis script…");

      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, useKnowledge: activeProfile === "creavoo" ? useKnowledge : false, profile: activeProfile }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response body");

      // Baca stream SSE
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let data: SceneData | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "token") {
              const last = genLogsRef.current[genLogsRef.current.length - 1];
              if (last?.msg.startsWith("Mengirim ke AI") || last?.msg.startsWith("✍️")) {
                genLogsRef.current = [
                  ...genLogsRef.current.slice(0, -1),
                  { ts: last.ts, msg: `✍️ AI menulis… (${evt.len} karakter)`, type: "info" as const },
                ];
                setGenLogs([...genLogsRef.current]);
              }
            } else if (evt.type === "error") {
              throw new Error(evt.message);
            } else if (evt.type === "done") {
              data = evt.data as SceneData;
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      if (!data) throw new Error("AI tidak mengembalikan hasil yang valid");
      addLog(`Script selesai dalam ${((Date.now() - t0) / 1000).toFixed(1)}s — "${data.videoTitle}"`, "ok");
      addLog(`${data.tips.length} tips · layout: ${data.layout ?? "center"}`, "ok");
      setPreview(data);

      const newItem: HistoryItem = { id, title: data.videoTitle, status: "rendering", accent: data.accent, createdAt: new Date().toISOString(), caption: data.caption, hashtags: data.hashtags, autoTikTok, autoInstagram, igShareToFeed, profile: activeProfile };
      const updated = [newItem, ...history];
      saveHistory(updated);

      addLog("Trigger GitHub Actions untuk render…");
      const renderRes = await fetch("/api/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, voice, watermarkHandle, watermarkLogoUrl: activeProfile === "zaportfolio" ? null : watermarkLogoUrl, profile: activeProfile }),
      });
      if (!renderRes.ok) throw new Error(await renderRes.text());
      const { runId } = await renderRes.json();
      addLog(`GitHub Actions run #${runId} dimulai`, "ok");
      saveHistory(updated.map((h) => (h.id === id ? { ...h, runId } : h)));
      setStep("rendering");
      pollStatus(id, runId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi error";
      addLog(msg, "error");
      setError(msg);
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
    if (pollCleanupRef.current.timeout) clearTimeout(pollCleanupRef.current.timeout);
    if (pollCleanupRef.current.interval) clearInterval(pollCleanupRef.current.interval);

    pollActionLogs(runId);
    const poll = async () => {
      try {
        const res = await fetch(`/api/status?runId=${runId}`);
        const data = await res.json();
        pollActionLogs(runId);
        if (data.status === "completed" && data.videoUrl) {
          if (pollCleanupRef.current.interval) clearInterval(pollCleanupRef.current.interval);
          setVideoUrl(data.videoUrl); setStep("done");
          let doneItem: HistoryItem | undefined;
          setHistory((prev) => {
            const updated = prev.map((h) => h.id === id ? { ...h, status: "done" as const, videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl ?? h.thumbnailUrl } : h);
            doneItem = updated.find((h) => h.id === id);
            localStorage.setItem("vf_history", JSON.stringify(updated));
            return updated;
          });
          if (doneItem) {
            if (doneItem.autoTikTok && !doneItem.tiktokUrl) publish("tiktok", doneItem);
            if (doneItem.autoInstagram && !doneItem.instagramUrl) publish("instagram", doneItem);
          }
        } else if (data.status === "failed") {
          if (pollCleanupRef.current.interval) clearInterval(pollCleanupRef.current.interval);
          setError("Render gagal. Cek GitHub Actions untuk detail."); setStep("error");
          setHistory((prev) => {
            const updated = prev.map((h) => (h.id === id ? { ...h, status: "failed" as const } : h));
            localStorage.setItem("vf_history", JSON.stringify(updated));
            return updated;
          });
        } else {
          pollCleanupRef.current.timeout = setTimeout(poll, 15000);
        }
      } catch { pollCleanupRef.current.timeout = setTimeout(poll, 15000); }
    };
    pollCleanupRef.current.timeout = setTimeout(poll, 20000);
    const logsInterval = setInterval(() => pollActionLogs(runId), 15000);
    pollCleanupRef.current.interval = logsInterval;
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
        body: JSON.stringify({ platform, videoUrl: item.videoUrl, caption: captionText(item), thumbnailUrl: item.thumbnailUrl, igShareToFeed: item.igShareToFeed ?? true, profile: item.profile ?? activeProfile }),
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
      <SkeletonStyle />
      <Sidebar history={history} onSelectHistory={(id) => { const item = history.find(h => h.id === id); if (item) selectHistory(item); }} />

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ── Idle / Form ── */}
        {step === "idle" && (
          <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

            {/* LEFT — scrollable form */}
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "36px 40px" }}>

              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.25, margin: 0 }}>
                  Buat <span style={{ color: "#00AEEF" }}>video pendek</span> viral secara otomatis
                </h2>
                <p style={{ color: "#52525b", fontSize: 13, marginTop: 6 }}>Ketik topik, klik generate — AI pilih template & warna otomatis.</p>
              </div>

              {/* Profile tabs */}
              <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "#111113", border: "1px solid #ffffff0a", width: "fit-content", marginBottom: 20 }}>
                {PROFILES.map(p => {
                  const active = activeProfile === p.id;
                  return (
                    <button key={p.id} onClick={() => { setActiveProfile(p.id); localStorage.setItem("vf_profile", p.id); setTrendTopics([]); }}
                      style={{ padding: "6px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: active ? `1px solid ${p.color}40` : "1px solid transparent", background: active ? p.color + "20" : "transparent", color: active ? p.color : "#52525b", transition: "all 0.15s" }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Topic input */}
              <div style={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 16, padding: "16px 18px", marginBottom: 12 }}>
                <textarea
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, lineHeight: 1.6, resize: "none", fontFamily: "inherit" }}
                  rows={3}
                  placeholder="Ketik topik video kamu… misal: Lima perintah Git yang jarang diketahui developer"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button onClick={fetchTrends} disabled={loadingTrends}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 10, fontWeight: 700, fontSize: 12, border: "none", cursor: loadingTrends ? "default" : "pointer", background: loadingTrends ? "#ffffff08" : "linear-gradient(135deg,#f97316,#ef4444)", color: "white", boxShadow: loadingTrends ? "none" : "0 3px 14px #f9731650", opacity: loadingTrends ? 0.6 : 1, transition: "all 0.15s" }}>
                    {loadingTrends ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Mencari…</> : <><span>🔥</span> Trending Topik</>}
                  </button>
                </div>
                {trendTopics.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                    {trendTopics.map((t, i) => (
                      <button key={i} onClick={() => setTopic(t)}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer", background: topic === t ? "#f9731620" : "#ffffff0a", color: topic === t ? "#fb923c" : "#a1a1aa", border: `1px solid ${topic === t ? "#f9731640" : "#ffffff10"}`, transition: "all 0.15s" }}>
                        <span style={{ color: "#f97316", fontSize: 9 }}>▸</span>
                        <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings row: Knowledge/Theme + Voice */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {/* Knowledge / Theme */}
                <div style={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 14, padding: "14px 16px" }}>
                  {activeProfile === "creavoo" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Knowledge</p>
                        <p style={{ fontSize: 12, color: "#a1a1aa" }}>{useKnowledge ? "Creavoo tone aktif" : "Bebas"}</p>
                      </div>
                      <Toggle on={useKnowledge} onToggle={() => setUseKnowledge(v => !v)} />
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tema Konten</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {CONTENT_THEMES.map(t => {
                          const active = contentTheme === t.id;
                          return (
                            <button key={t.id} onClick={() => { setContentTheme(t.id); setTrendTopics([]); }}
                              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 10, cursor: "pointer", background: active ? "#6366f115" : "#ffffff07", border: `1px solid ${active ? "#6366f150" : "transparent"}`, transition: "all 0.15s" }}>
                              <span style={{ fontSize: 14 }}>{t.emoji}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#818cf8" : "#71717a" }}>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                {/* Voice */}
                <div style={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showVoice ? 10 : 0 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Voice</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#d4d4d8" }}>{selectedVoiceLabel}</p>
                    </div>
                    <button onClick={() => setShowVoice(v => !v)}
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #ffffff15", color: "#71717a", background: "transparent", cursor: "pointer" }}>
                      {showVoice ? "Tutup ▲" : "Ganti ▼"}
                    </button>
                  </div>
                  {showVoice && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {VOICES.map((v) => (
                        <button key={v.id} onClick={() => setVoice(v.id)}
                          style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: `1px solid ${voice === v.id ? "#00AEEF" : "transparent"}`, background: voice === v.id ? "#00AEEF15" : "#ffffff07", cursor: "pointer", textAlign: "left" as const }}>
                          <p style={{ fontSize: 10, color: "#71717a" }}>{v.flag} {v.desc}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }}>{v.label}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark */}
              <div style={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Watermark</p>
                {loadingWatermark ? (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                    {activeProfile !== "zaportfolio" && <Sk h={40} rounded={10} />}
                    <Sk h={40} rounded={10} />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {activeProfile !== "zaportfolio" && (<>
                      <button onClick={() => logoInputRef.current?.click()}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #ffffff10", background: "#ffffff07", cursor: "pointer", width: "100%", textAlign: "left" as const }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #ffffff10", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {uploadingLogo ? <span className="w-3.5 h-3.5 border border-zinc-500 border-t-transparent rounded-full animate-spin" /> : watermarkLogoUrl ? <img src={watermarkLogoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#d4d4d8" }}>{watermarkLogoUrl ? "Logo terupload ✓" : "Upload Logo"}</p>
                          <p style={{ fontSize: 10, color: "#52525b" }}>PNG/JPG · pojok kiri atas</p>
                        </div>
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                    </>)}
                    <input type="text" value={watermarkHandle}
                      onChange={(e) => { setWatermarkHandle(e.target.value); saveWatermark(e.target.value, watermarkLogoUrl); }}
                      placeholder="@yourhandle"
                      style={{ width: "100%", background: "transparent", border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
                  </div>
                )}
              </div>

              {/* Auto upload */}
              <div style={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Auto Upload</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  {activeProfile !== "zaportfolio" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>🎵</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>TikTok</p>
                          <p style={{ fontSize: 11, color: "#52525b" }}>Upload otomatis setelah render</p>
                        </div>
                      </div>
                      <Toggle on={autoTikTok} onToggle={() => setAutoTikTok(v => !v)} />
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📸</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>Instagram Reels</p>
                        <p style={{ fontSize: 11, color: "#52525b" }}>Upload otomatis setelah render</p>
                      </div>
                    </div>
                    <Toggle on={autoInstagram} onToggle={() => setAutoInstagram(v => !v)} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 26 }}>
                    <div>
                      <p style={{ fontSize: 12, color: "#a1a1aa" }}>Tampil di grid / feed profil</p>
                      <p style={{ fontSize: 10, color: "#52525b" }}>{igShareToFeed ? "Reels muncul di feed & Reels" : "Hanya di tab Reels"}</p>
                    </div>
                    <Toggle on={igShareToFeed} onToggle={() => setIgShareToFeed(v => !v)} />
                  </div>
                </div>
              </div>

              {/* Generate CTA */}
              <button onClick={generate} disabled={!topic.trim()}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, fontWeight: 800, fontSize: 15, color: "#fff", border: "none", cursor: topic.trim() ? "pointer" : "not-allowed", background: topic.trim() ? `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` : "#27272a", boxShadow: topic.trim() ? `0 6px 24px ${accentColor}55` : "none", opacity: topic.trim() ? 1 : 0.4, transition: "all 0.2s", marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Generate video sekarang
                <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>⌘↵</span>
              </button>
              <button onClick={() => setShowResetMemory(true)}
                style={{ width: "100%", padding: "8px 0", borderRadius: 12, fontSize: 11, color: "#52525b", background: "transparent", border: "1px solid transparent", cursor: "pointer" }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = "#f87171"; (e.target as HTMLButtonElement).style.borderColor = "#7f1d1d50"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = "#52525b"; (e.target as HTMLButtonElement).style.borderColor = "transparent"; }}>
                🗑 Reset memory AI
              </button>

            </div>{/* end left */}

            {/* RIGHT — phone preview */}
            <div style={{ width: 380, flexShrink: 0, borderLeft: "1px solid #ffffff08", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 18, padding: "32px 28px", overflowY: "auto" }}>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Preview</p>
                <p style={{ fontSize: 12, color: "#52525b" }}>{activeProfile === "zaportfolio" ? "Zaportfolio" : "Creavoo"}</p>
              </div>

              {/* Phone frame */}
              <div style={{ position: "relative", width: 280, height: 498, borderRadius: 36, overflow: "hidden", background: activeProfile === "zaportfolio" ? "#ffffff" : "#f0f0f8", boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)" }}>
                {activeProfile === "zaportfolio" ? (<>
                  <svg style={{ position: "absolute", top: 0, right: 0 }} width="100" height="100" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="pv-diag" x="0" y="0" width="8" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                        <rect width="4" height="14" fill="#1a3358" opacity="0.18" />
                      </pattern>
                      <clipPath id="pv-tri-tr"><polygon points="100,0 0,0 100,100" /></clipPath>
                    </defs>
                    <rect width="100" height="100" fill="url(#pv-diag)" clipPath="url(#pv-tri-tr)" />
                  </svg>
                  <svg style={{ position: "absolute", bottom: 0, left: 0 }} width="80" height="80" viewBox="0 0 80 80">
                    {Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => (
                      <circle key={`${row}-${col}`} cx={10 + col * 18} cy={10 + row * 18} r="2" fill="#1a3358" opacity="0.18" />
                    )))}
                  </svg>
                  <svg style={{ position: "absolute", top: 16, left: 10 }} width="24" height="24" viewBox="0 0 24 24">
                    <polygon points="12,2 22,22 2,22" fill="none" stroke="#1a3358" strokeWidth="1.5" opacity="0.25" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, #1a3358 1px, transparent 1px), linear-gradient(to bottom, #1a3358 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.04 }} />
                </>) : (<>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${accentColor}50 0%, transparent 65%)` }} />
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 85% 85%, #818cf830 0%, transparent 50%)` }} />
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right, ${accentColor}12 1px, transparent 1px), linear-gradient(to bottom, ${accentColor}12 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                </>)}
                {/* notch */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 52, height: 5, borderRadius: 10, background: activeProfile === "zaportfolio" ? "#1a335815" : "rgba(0,0,0,0.1)" }} />
                </div>
                {/* logo creavoo */}
                {activeProfile !== "zaportfolio" && (
                  <div style={{ position: "absolute", top: 32, left: 10, maxWidth: 46 }}>
                    {watermarkLogoUrl ? <img src={watermarkLogoUrl} alt="" style={{ height: 16, width: "auto", maxWidth: 40, objectFit: "contain", borderRadius: 3 }} /> : <div style={{ width: 14, height: 14, borderRadius: 4, background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>}
                  </div>
                )}
                {/* handle */}
                <div style={{ position: "absolute", top: 32, right: 10 }}>
                  <p style={{ fontSize: 8, fontWeight: 700, color: activeProfile === "zaportfolio" ? "#1a3358" : "#4b5563" }}>{watermarkHandle || "@handle"}</p>
                </div>
                {/* content mock */}
                {activeProfile === "zaportfolio" ? (
                  <div style={{ position: "absolute", left: 18, right: 18, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column" as const, gap: 10, alignItems: "center" }}>
                    {/* ZAPORTFOLIO pill tag */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "#1a335812", border: "1px solid #1a335825" }}>
                      <span style={{ fontSize: 12 }}>🤖</span>
                      <span style={{ fontSize: 8, fontWeight: 800, color: "#1a3358", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Zaportfolio</span>
                    </div>
                    {/* title bars */}
                    <div style={{ width: "100%", display: "flex", flexDirection: "column" as const, gap: 6, alignItems: "center" }}>
                      <div style={{ height: 9, borderRadius: 4, width: "95%", background: "#1a335828" }} />
                      <div style={{ height: 9, borderRadius: 4, width: "80%", background: "#1a335820" }} />
                    </div>
                    {/* subtitle bar */}
                    <div style={{ height: 6, borderRadius: 4, width: "70%", background: "#1a335514" }} />
                    {/* CTA button */}
                    <div style={{ marginTop: 4, padding: "6px 20px", borderRadius: 8, background: "#1a3358" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>Let's go →</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: "absolute", left: 18, right: 18, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column" as const, gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 28 }}>🎬</div>
                    <div style={{ height: 10, borderRadius: 99, width: "100%", background: "rgba(0,0,0,0.08)" }} />
                    <div style={{ height: 8, borderRadius: 99, width: "80%", background: "rgba(0,0,0,0.06)" }} />
                    <div style={{ height: 6, borderRadius: 99, width: "60%", background: "rgba(0,0,0,0.04)" }} />
                  </div>
                )}
                {/* home indicator */}
                <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 52, height: 4, borderRadius: 99, background: activeProfile === "zaportfolio" ? "#1a335818" : "rgba(0,0,0,0.1)" }} />
                </div>
              </div>

              <p style={{ fontSize: 10, color: "#3f3f46", textAlign: "center", lineHeight: 1.5 }}>Watermark preview<br/>Pojok kiri atas (logo) & kanan atas (handle)</p>

            </div>{/* end right */}

          </div>
        )}

        {/* ── Generating ── */}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center gap-6 px-8" style={{ flex: 1, minHeight: 0 }}>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }} />
              <p className="text-white font-bold text-base">AI sedang menulis script…</p>
            </div>
            {/* Live log terminal */}
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "#0d0d0f" }}>
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="text-[10px] text-zinc-600 ml-2 font-mono">generate.log</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-1.5 font-mono min-h-[120px]">
                {genLogs.map((log, i) => {
                  const elapsed = i === 0 ? 0 : ((log.ts - genLogs[0].ts) / 1000).toFixed(1);
                  return (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <span className="text-zinc-700 flex-shrink-0 tabular-nums">{i === 0 ? "+0.0s" : `+${elapsed}s`}</span>
                      <span className={log.type === "ok" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-zinc-400"}>
                        {log.type === "ok" ? "✓ " : log.type === "error" ? "✗ " : "› "}
                        {log.msg}
                      </span>
                    </div>
                  );
                })}
                {/* blinking cursor */}
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="text-zinc-700 flex-shrink-0">      </span>
                  <span className="w-1.5 h-3.5 bg-zinc-500 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rendering ── */}
        {step === "rendering" && (
          <div className="flex-1 overflow-y-auto min-h-0">
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
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && videoUrl && (
          <div className="flex-1 overflow-y-auto min-h-0">
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
                {/* TikTok — creavoo only */}
                {activeProfile !== "zaportfolio" && (activeItem?.tiktokUrl ? (
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
                ))}
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
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 min-h-0">
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
