"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HistoryItem = {
  id: string; title: string; status: "done" | "rendering" | "failed";
  videoUrl?: string; runId?: number; accent: string; createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ResultsPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingRun, setDeletingRun] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("vf_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const updateHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("vf_history", JSON.stringify(items));
  };

  const deleteVideo = async (item: HistoryItem) => {
    if (!confirm(`Hapus video "${item.title}"? Ini permanen.`)) return;
    setDeleting(item.id);
    try {
      if (item.videoUrl) {
        await fetch("/api/blob", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.videoUrl }),
        });
      }
      const updated = history.filter((h) => h.id !== item.id);
      updateHistory(updated);
      if (selected?.id === item.id) setSelected(null);
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const deleteAction = async (item: HistoryItem) => {
    if (!item.runId) return;
    if (!confirm(`Hapus GitHub Action run #${item.runId}?`)) return;
    setDeletingRun(item.id);
    try {
      await fetch("/api/actions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: item.runId }),
      });
      const updated = history.map((h) => h.id === item.id ? { ...h, runId: undefined } : h);
      updateHistory(updated);
    } catch { /* ignore */ }
    setDeletingRun(null);
  };

  const done = history.filter((h) => h.status === "done");
  const rendering = history.filter((h) => h.status === "rendering");
  const failed = history.filter((h) => h.status === "failed");

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-base font-black text-white">Video Factory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Dev shorts generator</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 pt-3">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🎬</span> Generate
          </Link>
          <Link href="/analytics" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>📊</span> Analytics
          </Link>
          <Link href="/results" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white bg-zinc-800 font-medium">
            <span>🎥</span> Results
          </Link>
        </nav>
      </aside>

      {/* Main: list + preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video list */}
        <div className="w-80 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-black text-white text-base">Results</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{done.length} selesai · {rendering.length} berjalan · {failed.length} gagal</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {history.length === 0 && (
              <p className="text-zinc-600 text-xs text-center mt-10">Belum ada video.</p>
            )}

            {[...done, ...rendering, ...failed].map((item) => (
              <div key={item.id}
                onClick={() => item.status === "done" ? setSelected(item) : null}
                className="rounded-xl p-3 border transition-all flex flex-col gap-1"
                style={{
                  borderColor: selected?.id === item.id ? item.accent : "#27272a",
                  background: selected?.id === item.id ? `${item.accent}15` : "#18181b",
                  cursor: item.status === "done" ? "pointer" : "default",
                }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-snug flex-1">{item.title}</p>
                  <span className="text-xs flex-shrink-0 mt-0.5">
                    {item.status === "done" ? "✓" : item.status === "rendering" ? "⟳" : "✗"}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">{timeAgo(item.createdAt)}</p>

                <div className="flex gap-1 mt-1">
                  {item.status === "done" && item.videoUrl && (
                    <a href={item.videoUrl} download
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
                      ↓ Download
                    </a>
                  )}
                  {item.runId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAction(item); }}
                      disabled={deletingRun === item.id}
                      className="text-xs px-2 py-1 rounded-lg bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 transition-colors disabled:opacity-50">
                      {deletingRun === item.id ? "..." : "🗑 Action"}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteVideo(item); }}
                    disabled={deleting === item.id}
                    className="text-xs px-2 py-1 rounded-lg bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 transition-colors disabled:opacity-50">
                    {deleting === item.id ? "..." : "🗑 Video"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video preview */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          {selected ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
              <div>
                <p className="text-xl font-black text-white text-center">{selected.title}</p>
                <p className="text-xs text-zinc-500 text-center mt-1">{timeAgo(selected.createdAt)}</p>
              </div>
              <div className="w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black" style={{ aspectRatio: "9/16" }}>
                <video src={selected.videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-3 w-full">
                <a href={selected.videoUrl} download="video.mp4"
                  className="flex-1 rounded-xl py-3 font-black text-white text-center text-sm"
                  style={{ background: selected.accent, boxShadow: `0 6px 20px ${selected.accent}55` }}>
                  Download MP4
                </a>
                <button onClick={() => deleteVideo(selected)} disabled={deleting === selected.id}
                  className="rounded-xl py-3 px-4 text-sm font-bold text-red-400 bg-zinc-800 hover:bg-red-950 transition-colors disabled:opacity-50">
                  {deleting === selected.id ? "..." : "🗑"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-600">
              <p className="text-4xl mb-3">🎥</p>
              <p className="text-sm">Pilih video dari list untuk preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
