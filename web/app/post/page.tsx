"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";

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

function PostPreview({
  data, postType, slideIndex, imageUrl, carouselSlides,
  watermarkHandle, watermarkLogoUrl,
}: {
  data: PostData; postType: PostType; slideIndex: number;
  imageUrl?: string | null; carouselSlides?: string[];
  watermarkHandle?: string; watermarkLogoUrl?: string | null;
}) {
  const ac = data.accent || "#6366f1";
  const tips = data.tips.slice(0, 5);
  // carousel: cover(0) + 5 tips(1-5) + outro(6) = 7 slides
  const totalSlides = tips.length + 2;

  // Show actual rendered image
  if (postType === "single" && imageUrl) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: "1/1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={data.videoTitle} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (postType === "carousel" && carouselSlides?.length) {
    const url = carouselSlides[Math.min(slideIndex, carouselSlides.length - 1)];
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: "1/1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Slide ${slideIndex + 1}`} className="w-full h-full object-cover" />
      </div>
    );
  }

  // HTML mockup preview
  const bgStyle = {
    background: "#f8f8fa",
    backgroundImage: `radial-gradient(circle at 50% 30%, ${ac}28 0%, transparent 65%)`,
  };
  const gridOverlay = {
    position: "absolute" as const, inset: 0, pointerEvents: "none" as const,
    backgroundImage: "linear-gradient(to right,#18181b 1px,transparent 1px),linear-gradient(to bottom,#18181b 1px,transparent 1px)",
    backgroundSize: "36px 36px", opacity: 0.05,
  };

  // Single post mockup
  if (postType === "single") {
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.08]"
        style={{ aspectRatio: "1/1", ...bgStyle, position: "relative", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
        <div style={gridOverlay} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <span style={{ fontSize: 28 }}>{data.introEmoji}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#18181b", lineHeight: 1.2 }}>{data.videoTitle}</p>
              <p style={{ fontSize: 9, color: "#71717a" }}>{data.subtitle}</p>
            </div>
          </div>
          <div style={{ height: 1.5, background: `${ac}33`, borderRadius: 2 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{
                flex: 1, display: "flex", alignItems: "center", gap: 7,
                padding: "5px 8px", borderRadius: 7,
                background: "rgba(255,255,255,0.6)", border: `1px solid ${ac}20`,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "white", flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.emoji}</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#18181b" }}>{tip.title}</p>
                  <p style={{ fontSize: 8, color: "#71717a" }}>{tip.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: ac, borderRadius: 7, padding: "6px", textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>{data.ctaText}</span>
          </div>
        </div>
        <WatermarkOverlay handle={watermarkHandle} logoUrl={watermarkLogoUrl} />
      </div>
    );
  }

  // Carousel mockup — show current slide
  const renderCarouselSlide = () => {
    if (slideIndex === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
          <span style={{ fontSize: 48, filter: `drop-shadow(0 0 12px ${ac}88)` }}>{data.introEmoji}</span>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#18181b", textAlign: "center", lineHeight: 1.2 }}>{data.videoTitle}</p>
          <p style={{ fontSize: 10, color: "#71717a", textAlign: "center" }}>{data.subtitle}</p>
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
          <p style={{ fontSize: 15, fontWeight: 900, color: "#18181b", textAlign: "center" }}>{data.ctaText}</p>
          <p style={{ fontSize: 9, color: "#71717a" }}>Simpan & share ke temen kamu!</p>
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white", boxShadow: `0 0 14px ${ac}66` }}>{slideIndex}</div>
        <span style={{ fontSize: 50, filter: `drop-shadow(0 0 12px ${ac}55)` }}>{tip.emoji}</span>
        <p style={{ fontSize: 14, fontWeight: 900, color: "#18181b", textAlign: "center", lineHeight: 1.2 }}>{tip.title}</p>
        <p style={{ fontSize: 10, color: "#71717a", textAlign: "center", maxWidth: 160 }}>{tip.subtitle}</p>
        <div style={{ height: 4, width: 40, borderRadius: 2, background: ac }} />
      </div>
    );
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08]"
      style={{ aspectRatio: "1/1", ...bgStyle, position: "relative" }}>
      <div style={gridOverlay} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {renderCarouselSlide()}
      </div>
      <SlideCounter current={slideIndex + 1} total={totalSlides} ac={ac} />
      <WatermarkOverlay handle={watermarkHandle} logoUrl={watermarkLogoUrl} />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PostPage() {
  const [topic, setTopic] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [postData, setPostData] = useState<PostData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [runId, setRunId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const postDataRef = useRef<PostData | null>(null);
  const [watermarkHandle, setWatermarkHandle] = useState("");
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const postType = "carousel" as const;
  const totalSlides = (postData?.tips.slice(0, 5).length ?? 5) + 2;

  useEffect(() => {
    fetch("/api/watermark").then(r => r.json()).then(d => {
      if (d.handle) setWatermarkHandle(d.handle);
      if (d.logoUrl) setWatermarkLogoUrl(d.logoUrl);
    }).catch(() => {});
  }, []);

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
    fetch("/api/trends").then(r => r.json()).then(d => setTrendTopics(d.topics ?? []))
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
        if (d.type === "carousel" && d.slides?.length) {
          setCarouselSlides(d.slides);
          setSlideIndex(0);
          setStep("done");
          saveImageHistory(runId, postDataRef.current, "carousel", undefined, d.slides);
        } else if (d.imageUrl) {
          setImageUrl(d.imageUrl);
          setStep("done");
          saveImageHistory(runId, postDataRef.current, "image", d.imageUrl, undefined);
        } else {
          setStep("error"); setError("Gambar tidak ditemukan.");
        }
      } catch { /* retry */ }
    }, 8000);
    return () => clearInterval(interval);
  }, [step, runId]);

  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating"); setError(null); setPostData(null);
    setImageUrl(null); setCarouselSlides([]); setSlideIndex(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, useKnowledge }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPostData(await res.json());
      setStep("idle");
    } catch (e) { setError(String(e)); setStep("error"); }
  };

  const render = async () => {
    if (!postData) return;
    setStep("rendering"); setError(null); setImageUrl(null); setCarouselSlides([]); setPublished(false); setPublishUrl(null);
    try {
      const res = await fetch("/api/render-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...postData, watermarkHandle, watermarkLogoUrl, type: postType, totalSlides }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setRunId(d.runId);
    } catch (e) { setError(String(e)); setStep("error"); }
  };

  const publishToInstagram = async () => {
    const url = postType === "carousel" ? carouselSlides[0] : imageUrl;
    if (!url || !postData) return;
    setPublishing(true);
    try {
      const caption = postData.caption
        ? postData.caption + (postData.hashtags?.length ? "\n\n" + postData.hashtags.map(h => `#${h}`).join(" ") : "")
        : postData.videoTitle;
      const body = postType === "carousel"
        ? { platform: "instagram", imageUrls: carouselSlides, caption, mediaType: "carousel" }
        : { platform: "instagram", imageUrl: url, caption, mediaType: "image" };
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.postUrl) setPublishUrl(d.postUrl);
      setPublished(true);
    } catch { /* ignore */ }
    setPublishing(false);
  };

  const copyCaption = () => {
    if (!postData?.caption) return;
    const full = postData.caption + (postData.hashtags?.length ? "\n\n" + postData.hashtags.map(h => `#${h}`).join(" ") : "");
    navigator.clipboard.writeText(full);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const hasDoneImage = step === "done" && (imageUrl || carouselSlides.length > 0);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">Post Gambar</h2>
            <p className="text-zinc-500 text-sm mt-1">Generate carousel infografis untuk Instagram feed</p>
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
                  <div className="flex flex-wrap gap-1.5">
                    {trendTopics.slice(0, 4).map((t, i) => (
                      <button key={i} onClick={() => setTopic(t)}
                        className="px-2.5 py-1 rounded-full text-[10px] text-zinc-400 border border-white/[0.08] hover:border-white/20 transition-colors">
                        {t}
                      </button>
                    ))}
                    <button onClick={loadTrends} disabled={loadingTrends}
                      className="px-2.5 py-1 rounded-full text-[10px] text-zinc-600 border border-white/[0.06] hover:text-zinc-400 transition-colors">
                      {loadingTrends ? "..." : "↻ Trending"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Knowledge toggle */}
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

              {/* Generate */}
              <button onClick={generate}
                disabled={!topic.trim() || step === "generating" || step === "rendering"}
                className="py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
                {step === "generating"
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
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
                    data={postData} postType={postType} slideIndex={slideIndex}
                    imageUrl={imageUrl} carouselSlides={carouselSlides.length ? carouselSlides : undefined}
                    watermarkHandle={watermarkHandle} watermarkLogoUrl={watermarkLogoUrl}
                  />

                  {/* Carousel slide nav */}
                  {postType === "carousel" && (
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
                      {postType === "carousel" && carouselSlides.length > 0 ? (
                        <a href={carouselSlides[0]} target="_blank" rel="noopener noreferrer"
                          className="py-2.5 rounded-xl font-bold text-white text-sm text-center"
                          style={{ background: "#22c55e" }}>
                          ↓ Download Slide 1 (lihat semua di Blob)
                        </a>
                      ) : imageUrl ? (
                        <a href={imageUrl} download={`post-${runId}.jpg`} target="_blank" rel="noopener noreferrer"
                          className="py-2.5 rounded-xl font-bold text-white text-sm text-center"
                          style={{ background: "#22c55e" }}>
                          ↓ Download Gambar
                        </a>
                      ) : null}

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
                <div className="rounded-xl border border-white/[0.07] flex items-center justify-center"
                  style={{ aspectRatio: "1/1", background: "#111113" }}>
                  <div className="text-center px-8">
                    <p className="text-4xl mb-3">{postType === "carousel" ? "🎠" : "🖼️"}</p>
                    <p className="text-xs text-zinc-600">Preview muncul setelah generate</p>
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
