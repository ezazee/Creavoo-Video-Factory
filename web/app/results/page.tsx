"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

type MediaType = "video" | "image" | "carousel";

type HistoryItem = {
  id: string; title: string; status: "done" | "rendering" | "failed";
  mediaType?: MediaType;
  // video
  videoUrl?: string; thumbnailUrl?: string; runId?: number; accent: string; createdAt: string;
  caption?: string; hashtags?: string[];
  tiktokUrl?: string; instagramUrl?: string;
  autoTikTok?: boolean; autoInstagram?: boolean; igShareToFeed?: boolean;
  // image / carousel
  imageUrl?: string;
  imageUrls?: string[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function mediaIcon(item: HistoryItem) {
  if (item.mediaType === "carousel") return "🎠";
  if (item.mediaType === "image") return "🖼️";
  return "🎥";
}

export default function ResultsPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(true);
  const [publishing, setPublishing] = useState<"tiktok" | "instagram" | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const pollRun = (runId: number, itemId: string) => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/status?runId=${runId}`);
        const d = await r.json();
        if (d.status === "completed") {
          clearInterval(interval);
          const blobRes = await fetch("/api/blob").then(r2 => r2.json());
          const videos: { url: string; pathname: string; uploadedAt: string }[] = blobRes.videos ?? [];
          const latest = videos[0];
          let doneItem: HistoryItem | undefined;
          setHistory(prev => {
            const updated = prev.map(h => h.id === itemId
              ? { ...h, status: "done" as const, videoUrl: latest?.url }
              : h);
            doneItem = updated.find(h => h.id === itemId);
            localStorage.setItem("vf_history", JSON.stringify(updated));
            return updated;
          });
          if (doneItem) {
            if (doneItem.autoTikTok && !doneItem.tiktokUrl) publish("tiktok", doneItem);
            if (doneItem.autoInstagram && !doneItem.instagramUrl) publish("instagram", doneItem);
          }
        } else if (d.status === "failed" || d.status === "cancelled") {
          clearInterval(interval);
          setHistory(prev => {
            const updated = prev.map(h => h.id === itemId ? { ...h, status: "failed" as const } : h);
            localStorage.setItem("vf_history", JSON.stringify(updated));
            return updated;
          });
        }
      } catch { /* ignore */ }
    }, 8000);
    return interval;
  };

  useEffect(() => {
    const local: HistoryItem[] = JSON.parse(localStorage.getItem("vf_history") ?? "[]");

    fetch("/api/blob")
      .then(r => r.json())
      .then(({
        videos,
        singleImages,
        carousels,
      }: {
        videos: { url: string; pathname: string; uploadedAt: string }[];
        singleImages: { url: string; pathname: string; uploadedAt: string; runId: string }[];
        carousels: { runId: string; slides: string[]; uploadedAt: string }[];
      }) => {
        const stillRendering = local.filter(h => h.status === "rendering");

        // ── Videos from blob ──
        const videoItems: HistoryItem[] = (videos ?? []).map((v) => {
          const match = local.find(h => h.videoUrl === v.url)
            ?? local.find(h => Math.abs(new Date(h.createdAt).getTime() - new Date(v.uploadedAt).getTime()) < 60000);
          return {
            id: match?.id ?? v.pathname,
            title: match?.title ?? v.pathname.replace(/^.*video-/, "video ").replace(".mp4", ""),
            status: "done" as const, mediaType: "video" as const,
            videoUrl: v.url, thumbnailUrl: match?.thumbnailUrl, runId: match?.runId,
            accent: match?.accent ?? "#6366f1", createdAt: match?.createdAt ?? v.uploadedAt,
            caption: match?.caption, hashtags: match?.hashtags,
            tiktokUrl: match?.tiktokUrl, instagramUrl: match?.instagramUrl,
            autoTikTok: match?.autoTikTok, autoInstagram: match?.autoInstagram, igShareToFeed: match?.igShareToFeed,
          };
        });

        // ── Single images from blob ──
        const imageItems: HistoryItem[] = (singleImages ?? []).map((img) => {
          const match = local.find(h => h.imageUrl === img.url || h.id === `img-${img.runId}`);
          return {
            id: match?.id ?? `img-${img.runId}`,
            title: match?.title ?? "Post Gambar",
            status: "done" as const, mediaType: "image" as const,
            imageUrl: img.url, accent: match?.accent ?? "#6366f1",
            createdAt: match?.createdAt ?? img.uploadedAt,
            caption: match?.caption, hashtags: match?.hashtags,
            instagramUrl: match?.instagramUrl,
          };
        });

        // ── Carousels from blob ──
        const carouselItems: HistoryItem[] = (carousels ?? []).map((c) => {
          const match = local.find(h => h.id === `img-${c.runId}`
            || (h.imageUrls && h.imageUrls[0] === c.slides[0]));
          return {
            id: match?.id ?? `img-${c.runId}`,
            title: match?.title ?? "Post Carousel",
            status: "done" as const, mediaType: "carousel" as const,
            imageUrls: c.slides, accent: match?.accent ?? "#6366f1",
            createdAt: match?.createdAt ?? c.uploadedAt,
            caption: match?.caption, hashtags: match?.hashtags,
            instagramUrl: match?.instagramUrl,
          };
        });

        const allBlobIds = new Set([...videoItems, ...imageItems, ...carouselItems].map(i => i.id));
        const merged = [
          ...stillRendering,
          ...videoItems, ...imageItems, ...carouselItems,
          ...local.filter(h => h.status === "failed" && !allBlobIds.has(h.id)),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Dedupe by id
        const seen = new Set<string>();
        const deduped = merged.filter(h => { if (seen.has(h.id)) return false; seen.add(h.id); return true; });

        setHistory(deduped);
        localStorage.setItem("vf_history", JSON.stringify(deduped));
        deduped.filter(h => h.status === "rendering" && h.runId).forEach(h => pollRun(h.runId!, h.id));
      })
      .catch(() => {
        setHistory(local);
        local.filter(h => h.status === "rendering" && h.runId).forEach(h => pollRun(h.runId!, h.id));
      })
      .finally(() => setLoadingBlob(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("vf_history", JSON.stringify(items));
  };

  const captionText = (item: HistoryItem) => {
    if (!item.caption) return "";
    const tags = (item.hashtags ?? []).map(h => `#${h.replace(/^#/, "")}`).join(" ");
    return tags ? `${item.caption}\n\n${tags}` : item.caption;
  };

  const copyCaption = async (item: HistoryItem) => {
    await navigator.clipboard.writeText(captionText(item)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const publish = async (platform: "tiktok" | "instagram", item: HistoryItem) => {
    setPublishing(platform); setPublishErr(null);
    try {
      const isImage = item.mediaType === "image" || item.mediaType === "carousel";
      const body = isImage
        ? item.mediaType === "carousel"
          ? { platform: "instagram", imageUrls: item.imageUrls, caption: captionText(item), mediaType: "carousel" }
          : { platform: "instagram", imageUrl: item.imageUrl, caption: captionText(item), mediaType: "image" }
        : { platform, videoUrl: item.videoUrl, caption: captionText(item), thumbnailUrl: item.thumbnailUrl, igShareToFeed: item.igShareToFeed ?? true };

      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setPublishErr(d.error ?? "Upload gagal"); return; }
      const key = platform === "tiktok" ? "tiktokUrl" : "instagramUrl";
      const updated = history.map(h => h.id === item.id ? { ...h, [key]: d.postUrl ?? "uploaded" } : h);
      updateHistory(updated);
      setSelected(s => s && s.id === item.id ? { ...s, [key]: d.postUrl ?? "uploaded" } : s);
    } catch (e) {
      setPublishErr(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setPublishing(null);
    }
  };

  const deleteItem = async (item: HistoryItem) => {
    const label = item.mediaType === "carousel" ? "carousel" : item.mediaType === "image" ? "gambar" : "video";
    if (!confirm(`Hapus ${label} "${item.title}"? Ini permanen.`)) return;
    setDeleting(item.id);

    const blobUrls: string[] = [];
    if (item.videoUrl) blobUrls.push(item.videoUrl);
    if (item.imageUrl) blobUrls.push(item.imageUrl);
    if (item.imageUrls?.length) blobUrls.push(...item.imageUrls);

    await Promise.allSettled([
      blobUrls.length && fetch("/api/blob", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: blobUrls }),
      }),
      item.runId && fetch("/api/actions", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: item.runId }),
      }),
    ]);

    const updated = history.filter(h => h.id !== item.id);
    updateHistory(updated);
    if (selected?.id === item.id) setSelected(null);
    setDeleting(null);
  };

  const done = history.filter(h => h.status === "done");
  const rendering = history.filter(h => h.status === "rendering");
  const failed = history.filter(h => h.status === "failed");

  const totalSlides = selected?.imageUrls?.length ?? 0;

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ background: "#111113" }}>
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="font-black text-white text-base">Results</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{done.length} selesai · {rendering.length} berjalan · {failed.length} gagal</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {loadingBlob && (
              <div className="flex items-center justify-center mt-10 gap-2 text-zinc-600">
                <span className="w-3.5 h-3.5 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Memuat dari cloud…</span>
              </div>
            )}
            {!loadingBlob && history.length === 0 && (
              <p className="text-zinc-600 text-xs text-center mt-10">Belum ada konten.</p>
            )}

            {[...done, ...rendering, ...failed].map((item) => (
              <div key={item.id}
                onClick={() => item.status === "done" ? (setSelected(item), setSlideIndex(0)) : null}
                className="rounded-xl p-3 border transition-all flex flex-col gap-1"
                style={{
                  borderColor: selected?.id === item.id ? item.accent : "transparent",
                  background: selected?.id === item.id ? `${item.accent}15` : "#ffffff07",
                  cursor: item.status === "done" ? "pointer" : "default",
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs flex-shrink-0">{mediaIcon(item)}</span>
                    <p className="text-sm font-semibold text-white leading-snug truncate">{item.title}</p>
                  </div>
                  <span className={`text-xs flex-shrink-0 mt-0.5 ${item.status === "done" ? "text-green-400" : item.status === "rendering" ? "text-yellow-400" : "text-red-400"}`}>
                    {item.status === "done" ? "✓" : item.status === "rendering" ? "⟳" : "✗"}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">{timeAgo(item.createdAt)}</p>

                <div className="flex gap-1 mt-1">
                  {item.status === "done" && (item.videoUrl || item.imageUrl || item.imageUrls?.[0]) && (
                    <a href={item.videoUrl ?? item.imageUrl ?? item.imageUrls![0]} download
                      onClick={e => e.stopPropagation()}
                      className="text-xs px-2 py-1 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white transition-colors">
                      ↓
                    </a>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); deleteItem(item); }}
                    disabled={deleting === item.id}
                    className="text-xs px-2 py-1 rounded-lg border border-white/[0.06] text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50">
                    {deleting === item.id ? "…" : "🗑 Hapus"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="flex gap-8 p-8 items-start min-h-full">

              {/* Media preview */}
              <div className="flex-shrink-0 flex flex-col gap-3">
                {selected.mediaType === "video" || !selected.mediaType ? (
                  <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black"
                    style={{ width: 220, height: 390 }}>
                    <video src={selected.videoUrl} controls className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl overflow-hidden border border-white/[0.08]"
                      style={{ width: 280, height: 280 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.mediaType === "carousel"
                          ? (selected.imageUrls?.[slideIndex] ?? selected.imageUrls?.[0])
                          : selected.imageUrl}
                        alt={selected.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selected.mediaType === "carousel" && totalSlides > 1 && (
                      <div className="flex items-center justify-between">
                        <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0}
                          className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30"
                          style={{ background: "#ffffff0f", color: "white" }}>‹</button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalSlides }).map((_, i) => (
                            <button key={i} onClick={() => setSlideIndex(i)}
                              className="rounded-full transition-all"
                              style={{
                                width: slideIndex === i ? 16 : 6, height: 6,
                                background: slideIndex === i ? (selected.accent || "#6366f1") : "#ffffff20",
                              }} />
                          ))}
                        </div>
                        <button onClick={() => setSlideIndex(i => Math.min(totalSlides - 1, i + 1))} disabled={slideIndex === totalSlides - 1}
                          className="w-8 h-8 rounded-lg text-sm font-bold disabled:opacity-30"
                          style={{ background: "#ffffff0f", color: "white" }}>›</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Info + actions */}
              <div className="flex flex-col gap-4 flex-1 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mediaIcon(selected)}</span>
                    <p className="text-xl font-black text-white leading-tight">{selected.title}</p>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{timeAgo(selected.createdAt)}</p>
                </div>

                {/* Download + Delete */}
                <div className="flex gap-2">
                  {selected.mediaType === "video" || !selected.mediaType ? (
                    <a href={selected.videoUrl} download="video.mp4"
                      className="flex items-center justify-center gap-2 flex-1 rounded-xl py-2.5 font-bold text-white text-sm"
                      style={{ background: selected.accent, boxShadow: `0 4px 16px ${selected.accent}50` }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download MP4
                    </a>
                  ) : (
                    <a
                      href={selected.mediaType === "carousel" ? selected.imageUrls?.[0] : selected.imageUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 flex-1 rounded-xl py-2.5 font-bold text-white text-sm"
                      style={{ background: selected.accent, boxShadow: `0 4px 16px ${selected.accent}50` }}>
                      ↓ {selected.mediaType === "carousel" ? `Download (${totalSlides} slide)` : "Download Gambar"}
                    </a>
                  )}
                  <button onClick={() => deleteItem(selected)} disabled={deleting === selected.id}
                    className="rounded-xl py-2.5 px-4 text-sm font-bold text-red-400 border border-white/[0.06] hover:border-red-800/50 transition-colors disabled:opacity-50"
                    style={{ background: "#111113" }}>
                    {deleting === selected.id ? "…" : "🗑"}
                  </button>
                </div>

                {/* Platform buttons */}
                {(selected.mediaType === "video" || !selected.mediaType) ? (
                  <div className="flex gap-2">
                    {selected.tiktokUrl ? (
                      <a href={selected.tiktokUrl !== "uploaded" ? selected.tiktokUrl : undefined} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-green-400 border border-green-800/40"
                        style={{ background: "#111113" }}>
                        🎵 Lihat di TikTok ↗
                      </a>
                    ) : (
                      <button onClick={() => publish("tiktok", selected)} disabled={publishing !== null}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-zinc-300 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-50"
                        style={{ background: "#111113" }}>
                        {publishing === "tiktok" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "🎵"}
                        Upload TikTok
                      </button>
                    )}
                    {selected.instagramUrl ? (
                      <a href={selected.instagramUrl !== "uploaded" ? selected.instagramUrl : undefined} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-green-400 border border-green-800/40"
                        style={{ background: "#111113" }}>
                        📸 Lihat di Instagram ↗
                      </a>
                    ) : (
                      <button onClick={() => publish("instagram", selected)} disabled={publishing !== null}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-zinc-300 border border-white/[0.06] hover:border-white/20 transition-colors disabled:opacity-50"
                        style={{ background: "#111113" }}>
                        {publishing === "instagram" ? <span className="w-3.5 h-3.5 border border-zinc-400 border-t-transparent rounded-full animate-spin" /> : "📸"}
                        Upload Instagram
                      </button>
                    )}
                  </div>
                ) : (
                  // Image / carousel — only Instagram
                  <div>
                    {selected.instagramUrl && selected.instagramUrl !== "uploaded" ? (
                      <a href={selected.instagramUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white w-full"
                        style={{ background: "linear-gradient(135deg,#E1306C,#F77737)" }}>
                        📸 Lihat di Instagram ↗
                      </a>
                    ) : selected.instagramUrl === "uploaded" ? (
                      <div className="rounded-xl py-2.5 text-sm font-semibold text-green-400 text-center border border-green-800/40"
                        style={{ background: "#111113" }}>
                        ✓ Berhasil diposting ke Instagram
                      </div>
                    ) : (
                      <button onClick={() => publish("instagram", selected)} disabled={publishing !== null}
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white w-full disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#E1306C,#F77737)" }}>
                        {publishing === "instagram"
                          ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting…</>
                          : `📸 Post ke Instagram${selected.mediaType === "carousel" ? " (Carousel)" : ""}`}
                      </button>
                    )}
                  </div>
                )}

                {publishErr && <p className="text-xs text-red-400">{publishErr}</p>}

                {/* Caption */}
                {selected.caption && (
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "#111113" }}>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Caption & Hashtag</p>
                      <button onClick={() => copyCaption(selected)}
                        className="text-xs px-3 py-1 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition-colors">
                        {copied ? "✓ Tersalin" : "Copy"}
                      </button>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selected.caption}</p>
                      {selected.hashtags && selected.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selected.hashtags.map((h, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400">#{h.replace(/^#/, "")}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-zinc-700">
              <div>
                <div className="w-16 h-16 rounded-2xl border border-white/[0.06] flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: "#111113" }}>📁</div>
                <p className="text-sm">Pilih item dari list untuk preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
