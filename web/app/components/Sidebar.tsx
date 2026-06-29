"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type HistoryItem = { id: string; title: string; status: "done" | "rendering" | "failed"; accent: string; createdAt: string };

export default function Sidebar({ history: historyProp, onSelectHistory }: {
  history?: HistoryItem[];
  onSelectHistory?: (id: string) => void;
}) {
  const path = usePathname();
  const router = useRouter();
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  useEffect(() => {
    const stored: HistoryItem[] = JSON.parse(localStorage.getItem("vf_history") ?? "[]");
    setLocalHistory(stored);
  }, [path]);

  const history = historyProp ?? localHistory;

  function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  }

  const nav = [
    { href: "/", label: "Generate", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg> },
    { href: "/post", label: "Post Gambar", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { href: "/results", label: "Results", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg> },
    { href: "/analytics", label: "Analytics", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
    { href: "/schedule", label: "Schedule", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/[0.06]" style={{ background: "#111113" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)" }}>V</div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Video Factory</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">by Creavoo</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 flex flex-col gap-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "#ffffff0f" : "transparent",
                color: active ? "white" : "#71717a",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#71717a"; }}>
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* New Video */}
      <div className="px-3 pb-3">
        <Link href="/"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f140" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Buat Video Baru
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 pb-2">
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-red-400 transition-colors"
          style={{ border: "1px solid #ffffff06" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>

      {/* History — tampil di semua halaman */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {history.length === 0 ? (
          <p className="text-xs text-zinc-700 text-center mt-8 px-2">Belum ada video. Buat yang pertama!</p>
        ) : (
          <>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-2">Recents</p>
            <div className="flex flex-col gap-0.5">
              {history.map((item) => (
                onSelectHistory && path === "/" ? (
                  <button key={item.id} onClick={() => onSelectHistory(item.id)}
                    className="w-full text-left rounded-lg px-2.5 py-2 text-xs transition-all flex items-start gap-2 hover:bg-white/[0.04]"
                    style={{ borderLeft: `2px solid ${item.accent}40` }}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${item.status === "done" ? "bg-green-400" : item.status === "rendering" ? "bg-yellow-400 animate-pulse" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-zinc-300 font-medium leading-tight">{item.title}</p>
                      <p className="text-zinc-600 text-[10px] mt-0.5">{timeAgo(item.createdAt)}</p>
                    </div>
                  </button>
                ) : (
                  <Link key={item.id} href="/"
                    className="w-full text-left rounded-lg px-2.5 py-2 text-xs transition-all flex items-start gap-2 hover:bg-white/[0.04]"
                    style={{ borderLeft: `2px solid ${item.accent}40` }}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${item.status === "done" ? "bg-green-400" : item.status === "rendering" ? "bg-yellow-400 animate-pulse" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-zinc-300 font-medium leading-tight">{item.title}</p>
                      <p className="text-zinc-600 text-[10px] mt-0.5">{timeAgo(item.createdAt)}</p>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
