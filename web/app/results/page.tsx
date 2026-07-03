"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { Sk, SkeletonStyle } from "../components/Skeleton";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

const PROFILES = [
  { id: "all", label: "All", color: "#a1a1aa" },
  { id: "creavoo", label: "Creavoo", color: "#00AEEF" },
  { id: "zaportfolio", label: "Zaportfolio", color: "#6366f1" },
];

const STATUS_BADGE: Record<ResultItem["status"], { label: string; color: string }> = {
  rendering: { label: "⟳ Rendering", color: "#eab308" },
  done: { label: "✓ Selesai", color: "#22c55e" },
  posted: { label: "🚀 Terposting", color: "#38bdf8" },
  failed: { label: "✗ Gagal", color: "#ef4444" },
};

export default function ResultsPage() {
  const [activeProfile, setActiveProfile] = useState("all");
  const [items, setItems] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (profile: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await fetch(`/api/results?profile=${profile}`).then(r => r.json());
      setItems(d.items ?? []);
    } catch { /* keep old */ }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    load(activeProfile);
  }, [activeProfile, load]);

  // Poll selama ada item yang masih rendering
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (items.some(i => i.status === "rendering")) {
      pollRef.current = setInterval(() => load(activeProfile, true), 10000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [items, activeProfile, load]);

  const counts = {
    done: items.filter(i => i.status === "done" || i.status === "posted").length,
    rendering: items.filter(i => i.status === "rendering").length,
    failed: items.filter(i => i.status === "failed").length,
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Header */}
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black">Results</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {counts.done} selesai · {counts.rendering} berjalan · {counts.failed} gagal
              </p>
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "#111113", border: "1px solid #ffffff0a" }}>
              {PROFILES.map(p => {
                const active = activeProfile === p.id;
                return (
                  <button key={p.id} onClick={() => setActiveProfile(p.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
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

          <SkeletonStyle />

          {/* Grid */}
          {loading ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "#111113" }}>
                  <Sk h={140} rounded={0} />
                  <div className="p-3.5 flex flex-col gap-2">
                    <Sk h={12} w={`${60 + (i % 3) * 12}%`} rounded={5} />
                    <Sk h={9} w="40%" rounded={5} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-zinc-700">
              <div className="w-16 h-16 rounded-2xl border border-white/[0.06] flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: "#111113" }}>📁</div>
              <p className="text-sm">Belum ada konten{activeProfile !== "all" ? ` untuk ${activeProfile}` : ""}.</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {items.map(item => {
                const badge = STATUS_BADGE[item.status];
                const profileColor = item.profile === "zaportfolio" ? "#6366f1" : "#00AEEF";
                const thumb = item.thumbnailUrl ?? item.imageUrls?.[0];
                return (
                  <Link key={`${item.profile}-${item.runId}`} href={`/results/${item.runId}`}
                    className="rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.18] transition-all group"
                    style={{ background: "#111113" }}>
                    {/* Thumbnail */}
                    <div className="relative" style={{ height: 150, background: "#0a0a0a" }}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : item.videoUrl ? (
                        <video src={`${item.videoUrl}#t=1`} muted preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">
                          {item.status === "rendering" ? "⏳" : item.mediaType === "carousel" ? "🎠" : "🎥"}
                        </div>
                      )}
                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur"
                          style={{ background: "#000000aa", color: profileColor }}>
                          {item.profile === "zaportfolio" ? "Zaportfolio" : "Creavoo"}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur"
                          style={{ background: "#000000aa", color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded backdrop-blur" style={{ background: "#000000aa" }}>
                          {item.mediaType === "carousel" ? `🎠 ${item.imageUrls?.length ?? "?"} slide` : "🎥 Video"}
                        </span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3.5">
                      <p className="text-sm font-bold text-white leading-snug line-clamp-2">{item.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-zinc-600">{timeAgo(item.createdAt)}</p>
                        <div className="flex gap-1">
                          {item.tiktokUrl && <span className="text-[10px]" title="TikTok terposting">🎵</span>}
                          {item.instagramUrl && <span className="text-[10px]" title="Instagram terposting">📸</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
