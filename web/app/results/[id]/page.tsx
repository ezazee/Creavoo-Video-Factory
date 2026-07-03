"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { Sk, SkeletonStyle } from "../../components/Skeleton";

type ResultItem = {
  runId: number;
  title: string;
  mediaType: "video" | "carousel" | "image";
  profile: string;
  status: "rendering" | "done" | "failed" | "posted";
  createdAt: string;
  caption?: string;
  hashtags?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  tiktokUrl?: string;
  instagramUrl?: string;
  legacy?: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<ResultItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [publishing, setPublishing] = useState<"tiktok" | "instagram" | null>(null);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/results?runId=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setItem(d.item))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const captionText = (it: ResultItem) => {
    if (!it.caption) return "";
    const tags = (it.hashtags ?? []).map(h => `#${h.replace(/^#/, "")}`).join(" ");
    return tags ? `${it.caption}\n\n${tags}` : it.caption;
  };

  const copyCaption = async () => {
    if (!item) return;
    await navigator.clipboard.writeText(captionText(item)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const publish = async (platform: "tiktok" | "instagram") => {
    if (!item) return;
    setPublishing(platform); setPublishErr(null);
    try {
      // Profile SELALU dari job record — tidak mungkin salah akun
      const body = item.mediaType === "carousel"
        ? { platform: "instagram", imageUrls: item.imageUrls, caption: captionText(item), mediaType: "carousel", profile: item.profile }
        : { platform, videoUrl: item.videoUrl, caption: captionText(item), thumbnailUrl: item.thumbnailUrl, profile: item.profile };
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setPublishErr(d.error ?? "Upload gagal"); return; }
      const key = platform === "tiktok" ? "tiktokUrl" : "instagramUrl";
      setItem(it => it ? { ...it, [key]: d.postUrl ?? "uploaded", status: "posted" } : it);
    } catch (e) {
      setPublishErr(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setPublishing(null);
    }
  };

  const deleteItem = async () => {
    if (!item) return;
    if (!confirm(`Hapus "${item.title}"? File dan history-nya dihapus permanen.`)) return;
    setDeleting(true);
    await fetch("/api/results", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: item.runId }),
    }).catch(() => {});
    router.push("/results");
  };

  const profileColor = item?.profile === "zaportfolio" ? "#6366f1" : "#00AEEF";
  const totalSlides = item?.imageUrls?.length ?? 0;
  const isVideo = item?.mediaType === "video";

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Link href="/results" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-6">
            ← Kembali ke Results
          </Link>

          <SkeletonStyle />
          {loading ? (
            <div className="flex gap-8">
              <Sk w={280} h={400} rounded={16} />
              <div className="flex-1 flex flex-col gap-3 pt-2">
                <Sk h={24} w="70%" rounded={6} />
                <Sk h={12} w="40%" rounded={5} />
                <Sk h={80} rounded={12} />
              </div>
            </div>
          ) : notFound || !item ? (
            <div className="text-center py-24 text-zinc-600">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm">Item tidak ditemukan — mungkin sudah dihapus.</p>
            </div>
          ) : (
            <div className="flex gap-8 items-start flex-wrap">
              {/* ── Media ── */}
              <div className="flex-shrink-0 flex flex-col gap-3">
                {isVideo ? (
                  <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black" style={{ width: 260, height: 462 }}>
                    {item.videoUrl
                      ? <video src={item.videoUrl} controls poster={item.thumbnailUrl} className="w-full h-full object-contain" />
                      : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">{item.status === "rendering" ? "⏳ Masih render…" : "Video tidak tersedia"}</div>}
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ width: 320, height: 320, background: "#111113" }}>
                      {item.imageUrls?.length ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrls[slideIndex] ?? item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">{item.status === "rendering" ? "⏳ Masih render…" : "Gambar tidak tersedia"}</div>
                      )}
                    </div>
                    {totalSlides > 1 && (
                      <div className="flex items-center justify-between" style={{ width: 320 }}>
                        <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0}
                          className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30" style={{ background: "#ffffff0f" }}>‹</button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalSlides }).map((_, i) => (
                            <button key={i} onClick={() => setSlideIndex(i)}
                              className="rounded-full transition-all"
                              style={{ width: slideIndex === i ? 16 : 6, height: 6, background: slideIndex === i ? profileColor : "#ffffff20" }} />
                          ))}
                        </div>
                        <button onClick={() => setSlideIndex(i => Math.min(totalSlides - 1, i + 1))} disabled={slideIndex === totalSlides - 1}
                          className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30" style={{ background: "#ffffff0f" }}>›</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Info ── */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: profileColor + "18", color: profileColor, border: `1px solid ${profileColor}35` }}>
                      {item.profile === "zaportfolio" ? "Zaportfolio" : "Creavoo"}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] text-zinc-400">
                      {item.mediaType === "carousel" ? `🎠 Carousel · ${totalSlides} slide` : "🎥 Video"}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] text-zinc-500 font-mono">
                      #{item.runId}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black leading-tight">{item.title}</h1>
                  <p className="text-xs text-zinc-500 mt-1.5">{formatDate(item.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {(item.videoUrl || item.imageUrls?.length) && (
                      <a href={item.videoUrl ?? item.imageUrls![0]} download target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 flex-1 rounded-xl py-2.5 font-bold text-white text-sm"
                        style={{ background: profileColor, boxShadow: `0 4px 16px ${profileColor}40` }}>
                        ↓ Download {isVideo ? "MP4" : `(${totalSlides} slide)`}
                      </a>
                    )}
                    <button onClick={deleteItem} disabled={deleting}
                      className="rounded-xl py-2.5 px-4 text-sm font-bold text-red-400 border border-white/[0.06] hover:border-red-800/50 transition-colors disabled:opacity-50"
                      style={{ background: "#111113" }}>
                      {deleting ? "…" : "🗑 Hapus"}
                    </button>
                  </div>

                  {/* Publish */}
                  {(item.status === "done" || item.status === "posted") && (
                    <div className="flex gap-2">
                      {isVideo && (item.tiktokUrl ? (
                        <a href={item.tiktokUrl !== "uploaded" && item.tiktokUrl !== "posted" ? item.tiktokUrl : undefined} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-green-400 border border-green-800/40"
                          style={{ background: "#111113" }}>
                          🎵 TikTok ✓
                        </a>
                      ) : (
                        <button onClick={() => publish("tiktok")} disabled={publishing !== null || !item.videoUrl}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-zinc-300 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-50"
                          style={{ background: "#111113" }}>
                          {publishing === "tiktok" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "🎵"} Upload TikTok
                        </button>
                      ))}
                      {item.instagramUrl ? (
                        <a href={item.instagramUrl !== "uploaded" && item.instagramUrl !== "posted" ? item.instagramUrl : undefined} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-green-400 border border-green-800/40"
                          style={{ background: "#111113" }}>
                          📸 Instagram ✓
                        </a>
                      ) : (
                        <button onClick={() => publish("instagram")} disabled={publishing !== null || (!item.videoUrl && !item.imageUrls?.length)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-zinc-300 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-50"
                          style={{ background: "#111113" }}>
                          {publishing === "instagram" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "📸"} Upload Instagram
                        </button>
                      )}
                    </div>
                  )}
                  {publishErr && <p className="text-xs text-red-400">{publishErr}</p>}
                  <p className="text-[11px] text-zinc-700">
                    Upload memakai akun <span style={{ color: profileColor }}>{item.profile === "zaportfolio" ? "Zaportfolio" : "Creavoo"}</span> sesuai asal generate.
                  </p>
                </div>

                {/* Caption */}
                {item.caption ? (
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "#111113" }}>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Caption & Hashtag</p>
                      <button onClick={copyCaption}
                        className="text-xs px-3 py-1 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition-colors">
                        {copied ? "✓ Tersalin" : "Copy"}
                      </button>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.caption}</p>
                      {item.hashtags && item.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.hashtags.map((h, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400">#{h.replace(/^#/, "")}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : item.legacy ? (
                  <p className="text-xs text-zinc-700">Item lama — caption & hashtag tidak tersimpan untuk render sebelum sistem history baru.</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
