"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { SkeletonStyle } from "../components/Skeleton";

type Step = "idle" | "generating" | "rendering" | "done" | "error";

type TipData = { title: string; subtitle: string; emoji: string };
type PostData = {
  videoTitle: string; subtitle: string; introEmoji: string;
  accent: string; tips: TipData[]; ctaText: string;
  caption?: string; hashtags?: string[];
};

async function pollRun(runId: number): Promise<{ status: string; conclusion: string | null }> {
  const res = await fetch(`/api/run-status?runId=${runId}`);
  return res.json();
}

// ── Preview mockup ─────────────────────────────────────────────────────────────
function SlideCounter({ current, total, ac }: { current: number; total: number; ac: string }) {
  return (
    <div style={{
      position: "absolute", top: 10, right: 10,
      background: `${ac}ee`, borderRadius: 12, padding: "3px 10px",
    }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: "white" }}>{current}/{total}</span>
    </div>
  );
}

function WatermarkOverlay({ handle, logoUrl }: { handle?: string; logoUrl?: string | null }) {
  return (
    <>
      {logoUrl && (
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 3,
          background: "rgba(255,255,255,0.88)", borderRadius: 6, padding: "3px 6px",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" style={{ height: 14, width: "auto", maxWidth: 40, objectFit: "contain", display: "block" }} />
        </div>
      )}
      {handle && (
        <div style={{
          position: "absolute", bottom: 10, right: 12, zIndex: 3,
          background: "rgba(255,255,255,0.88)", borderRadius: 8, padding: "2px 7px",
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#18181b" }}>{handle}</span>
        </div>
      )}
    </>
  );
}

function ZaportfolioBg({ ac }: { ac: string }) {
  const navy = "#1a3358";
  return (
    <>
      {/* Top-right diagonal stripe triangle */}
      <svg style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none" }} width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <pattern id="pp-diag" x="0" y="0" width="10" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="5" height="18" fill={navy} opacity="0.2" />
          </pattern>
          <clipPath id="pp-tri-tr"><polygon points="160,0 0,0 160,160" /></clipPath>
        </defs>
        <rect width="160" height="160" fill="url(#pp-diag)" clipPath="url(#pp-tri-tr)" />
      </svg>
      {/* Bottom-left dot grid */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, pointerEvents: "none" }} width="110" height="110" viewBox="0 0 110 110">
        {Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={10 + col * 18} cy={10 + row * 18} r="2.5" fill={navy} opacity="0.18" />
        )))}
      </svg>
      {/* Top-left outline triangle */}
      <svg style={{ position: "absolute", top: 14, left: 14, pointerEvents: "none" }} width="36" height="36" viewBox="0 0 36 36">
        <polygon points="18,2 34,34 2,34" fill="none" stroke={navy} strokeWidth="2" opacity="0.22" />
      </svg>
      {/* Bottom-right outline triangles */}
      <svg style={{ position: "absolute", bottom: 14, right: 14, pointerEvents: "none" }} width="48" height="48" viewBox="0 0 48 48">
        <polygon points="24,2 46,46 2,46" fill="none" stroke={navy} strokeWidth="2" opacity="0.22" />
        <polygon points="24,14 38,38 10,38" fill="none" stroke={navy} strokeWidth="1.5" opacity="0.12" />
      </svg>
      {/* Navy bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "#1a3358", opacity: 0.7 }} />
    </>
  );
}

function CreavaoBg({ ac }: { ac: string }) {
  return (
    <>
      {/* Light gradient background overlay */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 20%, ${ac}40 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #818cf840 0%, transparent 55%)`, pointerEvents: "none" }} />
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right,${ac}18 1px,transparent 1px),linear-gradient(to bottom,${ac}18 1px,transparent 1px)`, backgroundSize: "24px 24px", pointerEvents: "none" }} />
      {/* Top-right decorative circle */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", border: `2px solid ${ac}40`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 5, right: 5, width: 60, height: 60, borderRadius: "50%", border: `1.5px solid ${ac}28`, pointerEvents: "none" }} />
      {/* Bottom-left dots */}
      <svg style={{ position: "absolute", bottom: 14, left: 14, pointerEvents: "none" }} width="64" height="64" viewBox="0 0 64 64">
        {Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={8 + c * 16} cy={8 + r * 16} r="2.5" fill={ac} opacity="0.25" />
        )))}
      </svg>
      {/* Accent bar bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${ac},#818cf8)`, opacity: 0.7 }} />
    </>
  );
}

function PostPreview({
  data, slideIndex, carouselSlides,
  watermarkHandle, watermarkLogoUrl, profile,
}: {
  data: PostData; slideIndex: number;
  carouselSlides?: string[];
  watermarkHandle?: string; watermarkLogoUrl?: string | null;
  profile?: string;
}) {
  const ac = profile === "zaportfolio" ? "#1a3358" : (data.accent || "#6366f1");
  const tips = data.tips.slice(0, 5);
  const totalSlides = tips.length + 2;
  const isZap = profile === "zaportfolio";

  // Show actual rendered slides
  if (carouselSlides?.length) {
    const url = carouselSlides[Math.min(slideIndex, carouselSlides.length - 1)];
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: "1/1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Slide ${slideIndex + 1}`} className="w-full h-full object-cover" />
      </div>
    );
  }

  const textPrimary = isZap ? "#1a3358" : "#18181b";
  const textSecondary = isZap ? "#4a6080" : "#71717a";

  const bgStyle = isZap
    ? { background: "#ffffff" }
    : { background: "#f8f8fa", backgroundImage: `radial-gradient(circle at 50% 30%, ${ac}28 0%, transparent 65%)` };

  const gridOverlay = {
    position: "absolute" as const, inset: 0, pointerEvents: "none" as const,
    backgroundImage: isZap
      ? `linear-gradient(to right,#1a3358 1px,transparent 1px),linear-gradient(to bottom,#1a3358 1px,transparent 1px)`
      : `linear-gradient(to right,#18181b 1px,transparent 1px),linear-gradient(to bottom,#18181b 1px,transparent 1px)`,
    backgroundSize: "36px 36px", opacity: 0.04,
  };

  const renderCarouselSlide = () => {
    if (slideIndex === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, padding: "0 20px" }}>
          <span style={{ fontSize: 48, filter: `drop-shadow(0 0 12px ${ac}88)` }}>{data.introEmoji}</span>
          <p style={{ fontSize: 16, fontWeight: 900, color: textPrimary, textAlign: "center", lineHeight: 1.2 }}>{data.videoTitle}</p>
          <p style={{ fontSize: 10, color: textSecondary, textAlign: "center" }}>{data.subtitle}</p>
          <div style={{ background: ac, borderRadius: 10, padding: "6px 18px", marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: "white" }}>Swipe → {tips.length} tips</span>
          </div>
        </div>
      );
    }
    if (slideIndex === totalSlides - 1) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
          <span style={{ fontSize: 40 }}>💬</span>
          <p style={{ fontSize: 15, fontWeight: 900, color: textPrimary, textAlign: "center" }}>{data.ctaText}</p>
          <p style={{ fontSize: 9, color: textSecondary }}>Simpan & share ke temen kamu!</p>
          <div style={{ display: "flex", gap: 6 }}>
            {["Save", "Share", "Follow"].map(l => (
              <div key={l} style={{ background: `${ac}18`, border: `1.5px solid ${ac}44`, borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: ac }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const tip = tips[slideIndex - 1];
    if (!tip) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, padding: "0 16px" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white", boxShadow: `0 0 14px ${ac}66` }}>{slideIndex}</div>
        <span style={{ fontSize: 50, filter: `drop-shadow(0 0 12px ${ac}55)` }}>{tip.emoji}</span>
        <p style={{ fontSize: 14, fontWeight: 900, color: textPrimary, textAlign: "center", lineHeight: 1.2 }}>{tip.title}</p>
        <p style={{ fontSize: 10, color: textSecondary, textAlign: "center", maxWidth: 160 }}>{tip.subtitle}</p>
        <div style={{ height: 4, width: 40, borderRadius: 2, background: ac }} />
      </div>
    );
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08]"
      style={{ aspectRatio: "1/1", ...bgStyle, position: "relative" }}>
      {isZap ? <ZaportfolioBg ac={ac} /> : <div style={gridOverlay} />}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {renderCarouselSlide()}
      </div>
      <SlideCounter current={slideIndex + 1} total={totalSlides} ac={ac} />
      {!isZap && <WatermarkOverlay handle={watermarkHandle} logoUrl={watermarkLogoUrl} />}
      {isZap && watermarkHandle && (
        <div style={{ position: "absolute", top: 10, right: 12, zIndex: 3 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#1a3358" }}>{watermarkHandle}</span>
        </div>
      )}
    </div>
  );
}

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

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PostPage() {
  const [activeProfile, setActiveProfile] = useState("creavoo");
  const [contentTheme, setContentTheme] = useState("it-developer");
  const [topic, setTopic] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [postData, setPostData] = useState<PostData | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [runId, setRunId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [genLogs, setGenLogs] = useState<{ ts: number; msg: string; type: "info" | "ok" | "error" }[]>([]);
  const genLogsRef = useRef<typeof genLogs>([]);
  const postDataRef = useRef<PostData | null>(null);
  const autoInstagramRef = useRef(false);
  const [layoutChoice, setLayoutChoice] = useState<"auto" | "center" | "side" | "bold">("auto");
  const [autoInstagram, setAutoInstagram] = useState(false);
  const [watermarkHandle, setWatermarkHandle] = useState("");
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const totalSlides = (postData?.tips.slice(0, 5).length ?? 5) + 2;

  useEffect(() => {
    const stored = localStorage.getItem("vf_profile");
    if (stored === "zaportfolio") setActiveProfile("zaportfolio");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/watermark?profile=${activeProfile}`, { signal: controller.signal })
      .then(r => r.json()).then(d => {
        setWatermarkHandle(d.handle ?? "");
        setWatermarkLogoUrl(d.logoUrl ?? null);
      }).catch(() => {});
    return () => controller.abort();
  }, [activeProfile]);

  // Keep ref in sync so polling closure can access latest postData
  useEffect(() => { postDataRef.current = postData; }, [postData]);

  const saveImageHistory = (
    rId: number | null, data: PostData | null,
    mediaType: "image" | "carousel", imgUrl?: string, imgUrls?: string[],
  ) => {
    if (!data || !rId) return;
    const item = {
      id: `img-${rId}`, title: data.videoTitle, status: "done",
      runId: rId,
      accent: data.accent ?? "#6366f1", createdAt: new Date().toISOString(),
      caption: data.caption, hashtags: data.hashtags,
      mediaType, imageUrl: imgUrl, imageUrls: imgUrls,
    };
    try {
      const prev = JSON.parse(localStorage.getItem("vf_history") ?? "[]");
      const deduped = prev.filter((h: { id: string }) => h.id !== item.id);
      localStorage.setItem("vf_history", JSON.stringify([item, ...deduped]));
    } catch { /* ignore */ }
  };

  const loadTrends = () => {
    setLoadingTrends(true);
    const params = new URLSearchParams({ profile: activeProfile });
    if (activeProfile === "zaportfolio") params.set("contentTheme", contentTheme);
    fetch(`/api/trends?${params}`).then(r => r.json()).then(d => setTrendTopics(d.topics ?? []))
      .catch(() => {}).finally(() => setLoadingTrends(false));
  };

  // Poll GitHub Actions
  useEffect(() => {
    if (step !== "rendering" || !runId) return;
    const interval = setInterval(async () => {
      try {
        const run = await pollRun(runId);
        if (run.status !== "completed") return;
        clearInterval(interval);
        if (run.conclusion !== "success") {
          setStep("error"); setError("GitHub Actions gagal."); return;
        }
        const res = await fetch(`/api/image-result?runId=${runId}`);
        const d = await res.json();
        if (d.slides?.length) {
          setCarouselSlides(d.slides);
          setSlideIndex(0);
          setStep("done");
          saveImageHistory(runId, postDataRef.current, "carousel", undefined, d.slides);
          if (autoInstagramRef.current) autoPublishCarousel(runId, d.slides);
        } else {
          setStep("error"); setError("Slide tidak ditemukan.");
        }
      } catch { /* retry */ }
    }, 8000);
    return () => clearInterval(interval);
  }, [step, runId]);

  const addLog = (msg: string, type: "info" | "ok" | "error" = "info") => {
    const entry = { ts: Date.now(), msg, type };
    genLogsRef.current = [...genLogsRef.current, entry];
    setGenLogs([...genLogsRef.current]);
  };

  const generate = async () => {
    if (!topic.trim()) return;
    genLogsRef.current = [];
    setGenLogs([]);
    setStep("generating"); setError(null); setPostData(null);
    setCarouselSlides([]); setSlideIndex(0);
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

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data = evt.data as any;
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
      setPostData(data);
      setStep("idle");
    } catch (e) {
      const msg = String(e);
      addLog(msg, "error");
      setError(msg);
      setStep("error");
    }
  };

  const render = async () => {
    if (!postData) return;
    setStep("rendering"); setError(null); setCarouselSlides([]); setPublished(false); setPublishUrl(null);
    autoInstagramRef.current = autoInstagram;
    try {
      const res = await fetch("/api/render-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...postData, layout: layoutChoice, watermarkHandle, watermarkLogoUrl, type: "carousel", totalSlides, style: activeProfile, autoInstagram }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setRunId(d.runId);
    } catch (e) { setError(String(e)); setStep("error"); }
  };

  const publishCarousel = async (slides: string[]) => {
    const data = postDataRef.current;
    if (!slides.length || !data) return;
    setPublishing(true);
    try {
      const caption = data.caption
        ? data.caption + (data.hashtags?.length ? "\n\n" + data.hashtags.map(h => `#${h}`).join(" ") : "")
        : data.videoTitle;
      const body = { platform: "instagram", imageUrls: slides, caption, mediaType: "carousel", profile: activeProfile };
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.postUrl) setPublishUrl(d.postUrl);
      setPublished(true);
    } catch { /* ignore */ }
    setPublishing(false);
  };

  const publishToInstagram = () => publishCarousel(carouselSlides);

  // Auto-post setelah render selesai. Webhook server (/api/schedule/complete)
  // mungkin sudah memposting duluan — cek job record dulu supaya tidak dobel.
  const autoPublishCarousel = async (rId: number, slides: string[]) => {
    setPublishing(true);
    try {
      // Beri waktu webhook server memproses, lalu cek statusnya
      for (let i = 0; i < 2; i++) {
        const r = await fetch(`/api/results?runId=${rId}`).then(res => res.ok ? res.json() : null).catch(() => null);
        const ig = r?.item?.instagramUrl;
        if (ig) {
          // Server sudah memposting — tinggal tampilkan hasilnya
          if (ig !== "posted" && ig !== "uploaded") setPublishUrl(ig);
          setPublished(true);
          setPublishing(false);
          return;
        }
        if (i === 0) await new Promise(res => setTimeout(res, 10000));
      }
    } catch { /* lanjut publish client-side */ }
    setPublishing(false);
    await publishCarousel(slides);
  };

  const copyCaption = () => {
    if (!postData?.caption) return;
    const full = postData.caption + (postData.hashtags?.length ? "\n\n" + postData.hashtags.map(h => `#${h}`).join(" ") : "");
    navigator.clipboard.writeText(full);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const hasDoneImage = step === "done" && carouselSlides.length > 0;

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <SkeletonStyle />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">

          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Post Gambar</h2>
                <p className="text-zinc-500 text-sm mt-1">Generate carousel infografis untuk Instagram feed</p>
              </div>
              <div className="flex gap-2 p-1 rounded-xl" style={{ background: "#111113", border: "1px solid #ffffff0a" }}>
                {PROFILES.map(p => {
                  const active = activeProfile === p.id;
                  return (
                    <button key={p.id} onClick={() => { setActiveProfile(p.id); localStorage.setItem("vf_profile", p.id); }}
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
            </div>
          </div>

          <div className="flex gap-8">

            {/* ── Left: Form ── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

              <p className="text-[11px] text-zinc-500 px-1">
                🎠 Carousel — Cover + {(postData?.tips.length ?? 5)} tips + Outro = {totalSlides} slide
              </p>

              {/* Topic */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Topik</p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <textarea value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="Contoh: 5 cara bikin konten Instagram yang viral"
                    rows={3}
                    className="w-full bg-transparent text-white text-sm placeholder-zinc-600 resize-none outline-none leading-relaxed" />
                  <div className="flex flex-col gap-2.5">
                    <button onClick={loadTrends} disabled={loadingTrends}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs w-fit transition-all disabled:opacity-50 active:scale-95"
                      style={{
                        background: loadingTrends ? "#ffffff08" : "linear-gradient(135deg,#f97316,#ef4444)",
                        color: "white",
                        boxShadow: loadingTrends ? "none" : "0 3px 12px #f9731640",
                      }}>
                      {loadingTrends
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Mencari trending…</>
                        : <><span className="text-sm">🔥</span> Trending Topik</>}
                    </button>
                    {trendTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {trendTopics.slice(0, 6).map((t, i) => (
                          <button key={i} onClick={() => setTopic(t)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-left transition-all active:scale-95 hover:scale-[1.02]"
                            style={{
                              background: topic === t ? "#f9731620" : "#ffffff0a",
                              color: topic === t ? "#fb923c" : "#a1a1aa",
                              border: `1px solid ${topic === t ? "#f9731640" : "#ffffff10"}`,
                            }}>
                            <span style={{ color: "#f97316", fontSize: 10 }}>▸</span>
                            <span className="truncate max-w-[200px]">{t}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Knowledge toggle — Creavoo only */}
              {activeProfile === "creavoo" ? (
                <div className="rounded-2xl border border-white/[0.07] px-5 py-3.5 flex items-center justify-between" style={{ background: "#111113" }}>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Ikut Knowledge Creavoo</p>
                    <p className="text-[11px] text-zinc-600">Gunakan tone & konteks produk Creavoo</p>
                  </div>
                  <button onClick={() => setUseKnowledge(v => !v)}
                    className="relative flex-shrink-0 rounded-full transition-colors"
                    style={{ width: 44, height: 24, background: useKnowledge ? "#00AEEF" : "#3f3f46" }}>
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: useKnowledge ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>
              ) : (
                /* Theme selector — Zaportfolio */
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                  <div className="px-5 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Tema Konten</p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-2">
                    {CONTENT_THEMES.map(t => {
                      const active = contentTheme === t.id;
                      return (
                        <button key={t.id} onClick={() => setContentTheme(t.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border"
                          style={{
                            background: active ? "#6366f115" : "#ffffff07",
                            borderColor: active ? "#6366f150" : "transparent",
                          }}>
                          <span className="text-base">{t.emoji}</span>
                          <p className="text-xs font-bold" style={{ color: active ? "#818cf8" : "#a1a1aa" }}>{t.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Layout selector */}
              <div className="rounded-2xl border border-white/[0.07] px-5 py-3.5" style={{ background: "#111113" }}>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Layout Slide</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "auto", label: "✨ Auto", desc: "Variatif per slide" },
                    { id: "center", label: "Center", desc: "Konten tengah" },
                    { id: "side", label: "Side", desc: "Teks kiri + media" },
                    { id: "bold", label: "Bold", desc: "Angka besar" },
                  ] as const).map(l => {
                    const active = layoutChoice === l.id;
                    return (
                      <button key={l.id} onClick={() => setLayoutChoice(l.id)}
                        className="px-3 py-2.5 rounded-xl text-left transition-all border"
                        style={{
                          background: active ? "#00AEEF15" : "#ffffff07",
                          borderColor: active ? "#00AEEF50" : "transparent",
                        }}>
                        <p className="text-xs font-bold" style={{ color: active ? "#38bdf8" : "#a1a1aa" }}>{l.label}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{l.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto upload Instagram */}
              <div className="rounded-2xl border border-white/[0.07] px-5 py-3.5 flex items-center justify-between" style={{ background: "#111113" }}>
                <div>
                  <p className="text-sm font-medium text-zinc-200">📸 Auto-upload ke Instagram</p>
                  <p className="text-[11px] text-zinc-600">Carousel otomatis diposting setelah render selesai (jalan di server, aman tutup browser)</p>
                </div>
                <button onClick={() => setAutoInstagram(v => !v)}
                  className="relative flex-shrink-0 rounded-full transition-colors"
                  style={{ width: 44, height: 24, background: autoInstagram ? "#00AEEF" : "#3f3f46" }}>
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{ transform: autoInstagram ? "translateX(20px)" : "translateX(0)" }} />
                </button>
              </div>

              {/* Watermark handle */}
              <div className="rounded-2xl border border-white/[0.07] px-5 py-3.5" style={{ background: "#111113" }}>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Watermark Username</p>
                <input
                  type="text"
                  value={watermarkHandle}
                  onChange={e => {
                    setWatermarkHandle(e.target.value);
                    fetch(`/api/watermark?profile=${activeProfile}`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ handle: e.target.value, logoUrl: watermarkLogoUrl }),
                    });
                  }}
                  placeholder={activeProfile === "zaportfolio" ? "@zaportfolio" : "@creavoo.id"}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                />
              </div>

              {/* Generate */}
              <button onClick={generate}
                disabled={!topic.trim() || step === "generating" || step === "rendering"}
                className="py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
                {step === "generating"
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" /> Generating…</>
                  : "✦ Generate Script"}
              </button>

              {/* Render */}
              {postData && step !== "generating" && (
                <button onClick={render} disabled={step === "rendering"}
                  className="py-3 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 border"
                  style={{ background: "#ffffff0f", borderColor: "#ffffff15", color: "white" }}>
                  {step === "rendering"
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rendering…</>
                    : `▶ Render Carousel (${totalSlides} slide)`}
                </button>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 px-4 py-3 text-xs text-red-400" style={{ background: "#ff000010" }}>
                  {error}
                </div>
              )}

              {/* Caption */}
              {postData && (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "#111113" }}>
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Caption</p>
                    <button onClick={copyCaption} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{postData.caption}</p>
                    {postData.hashtags && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {postData.hashtags.map((h, i) => (
                          <span key={i} className="text-[10px] text-[#00AEEF]">#{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Preview ── */}
            <div className="w-[320px] flex-shrink-0 flex flex-col gap-3">
              {postData ? (
                <>
                  <PostPreview
                    data={postData} slideIndex={slideIndex}
                    carouselSlides={carouselSlides.length ? carouselSlides : undefined}
                    watermarkHandle={watermarkHandle} watermarkLogoUrl={watermarkLogoUrl}
                    profile={activeProfile}
                  />

                  {/* Carousel slide nav */}
                  {(
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
                        disabled={slideIndex === 0}
                        className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30 transition-colors"
                        style={{ background: "#ffffff0f", color: "white" }}>‹</button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                          <button key={i} onClick={() => setSlideIndex(i)}
                            className="rounded-full transition-all"
                            style={{
                              width: slideIndex === i ? 16 : 6, height: 6,
                              background: slideIndex === i ? (postData.accent || "#6366f1") : "#ffffff20",
                            }} />
                        ))}
                      </div>
                      <button
                        onClick={() => setSlideIndex(i => Math.min(totalSlides - 1, i + 1))}
                        disabled={slideIndex === totalSlides - 1}
                        className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30 transition-colors"
                        style={{ background: "#ffffff0f", color: "white" }}>›</button>
                    </div>
                  )}

                  {/* Rendering status */}
                  {step === "rendering" && (
                    <div className="rounded-xl border border-yellow-500/20 px-4 py-3 text-xs text-yellow-400 flex flex-col gap-1.5" style={{ background: "#f59e0b10" }}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        Menunggu GitHub Actions…
                      </div>
                      {runId && (
                        <a
                          href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}/actions/runs/${runId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-yellow-300 underline underline-offset-2 hover:text-yellow-100 transition-colors pl-5"
                        >
                          Lihat log run #{runId} →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Done actions */}
                  {hasDoneImage && (
                    <div className="flex flex-col gap-2">
                      {carouselSlides.length > 0 && (
                        <a href={carouselSlides[0]} target="_blank" rel="noopener noreferrer"
                          className="py-2.5 rounded-xl font-bold text-white text-sm text-center"
                          style={{ background: "#22c55e" }}>
                          ↓ Download Slide 1 (lihat semua di Blob)
                        </a>
                      )}

                      {published ? (
                        publishUrl ? (
                          <a href={publishUrl} target="_blank" rel="noopener noreferrer"
                            className="py-2.5 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg,#E1306C,#F77737)", color: "white" }}>
                            📸 Lihat di Instagram ↗
                          </a>
                        ) : (
                          <div className="py-2.5 rounded-xl font-bold text-sm text-center"
                            style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" }}>
                            ✓ Berhasil diposting ke Instagram
                          </div>
                        )
                      ) : (
                        <button onClick={publishToInstagram} disabled={publishing}
                          className="py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg,#E1306C,#F77737)" }}>
                          {publishing
                            ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting…</>
                            : "📸 Post ke Instagram"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl overflow-hidden relative flex items-center justify-center"
                  style={{ aspectRatio: "1/1", background: activeProfile === "zaportfolio" ? "#ffffff" : "#f0f0f8", border: "1px solid #e4e4f0" }}>
                  {activeProfile === "zaportfolio" ? (
                    <>
                      <ZaportfolioBg ac="#6366f1" />
                      <div className="relative z-10 text-center px-8">
                        <p className="text-4xl mb-3">🎠</p>
                        <p className="text-xs font-semibold" style={{ color: "#1a3358", opacity: 0.5 }}>Preview muncul setelah generate</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CreavaoBg ac="#6366f1" />
                      <div className="relative z-10 text-center px-8">
                        <p className="text-4xl mb-3">🎠</p>
                        <p className="text-xs font-semibold" style={{ color: "#3730a3", opacity: 0.6 }}>Preview muncul setelah generate</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Live log di kanan bawah preview */}
              {genLogs.length > 0 && (
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "#0d0d0f" }}>
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06]">
                    <span className="w-2 h-2 rounded-full bg-red-500/60" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <span className="w-2 h-2 rounded-full bg-green-500/60" />
                    <span className="text-[10px] text-zinc-600 ml-2 font-mono">generate.log</span>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-1.5 font-mono max-h-64 overflow-y-auto">
                    {genLogs.map((log, i) => {
                      const elapsed = i === 0 ? "0.0" : ((log.ts - genLogs[0].ts) / 1000).toFixed(1);
                      return (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="text-zinc-700 flex-shrink-0 tabular-nums">+{elapsed}s</span>
                          <span className={log.type === "ok" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-zinc-400"}>
                            {log.type === "ok" ? "✓ " : log.type === "error" ? "✗ " : "› "}{log.msg}
                          </span>
                        </div>
                      );
                    })}
                    {step === "generating" && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-zinc-700 flex-shrink-0">       </span>
                        <span className="w-1.5 h-3 bg-zinc-500 animate-pulse rounded-sm" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
