"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Sk, SkeletonStyle } from "../components/Skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type PlatformStats = {
  posts?: number;
  likes?: number;
  views?: number;
  reach?: number;
  followers?: number;
  engagement_rate?: number;
  impressions?: number;
  comments?: number;
  shares?: number;
};

type DailyMetric = {
  date: string;
  views?: number;
  likes?: number;
  posts?: number;
};

type RecentPost = {
  platform: string;
  content: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  platformPostUrl: string | null;
  likes: number;
  views: number;
  reach: number;
  engagementRate: number;
};

type AnalyticsData = {
  tiktok: PlatformStats | null;
  instagram: PlatformStats | null;
  daily: DailyMetric[] | null;
  recentPosts?: RecentPost[];
  errors: { tiktok: string | null; instagram: string | null; daily: string | null };
};

const IG_COLOR = "#E1306C";
const DAYS_OPTIONS = [7, 30, 90];

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1" style={{ background: "#111113" }}>
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

function fmt(n?: number): string {
  if (n == null) return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtPct(n?: number): string {
  if (n == null) return "–";
  return n.toFixed(2) + "%";
}

function sum(a?: number, b?: number): number | undefined {
  if (a == null && b == null) return undefined;
  return (a ?? 0) + (b ?? 0);
}

const PROFILES = [
  { id: "creavoo", label: "Creavoo", color: "#00AEEF" },
  { id: "zaportfolio", label: "Zaportfolio", color: "#6366f1" },
];

export default function AnalyticsPage() {
  const [activeProfile, setActiveProfile] = useState("creavoo");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vf_profile");
    if (stored === "zaportfolio") setActiveProfile("zaportfolio");
  }, []);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      setError(null);
      fetch(`/api/analytics?days=${days}&profile=${activeProfile}`)
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch((e) => { setError(String(e)); setLoading(false); });
    };

    load();
    const interval = setInterval(load, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [days, activeProfile]);

  const tt = data?.tiktok;
  const ig = data?.instagram;
  const daily: DailyMetric[] = data?.daily ?? [];

  const totalPosts = sum(tt?.posts, ig?.posts);
  const totalLikes = sum(tt?.likes, ig?.likes);
  const totalViews = sum(tt?.views, ig?.views);
  const totalReach = sum(tt?.reach, ig?.reach);
  const totalFollowers = sum(tt?.followers, ig?.followers);

  const distData =
    totalPosts != null
      ? [
          { name: "TikTok", value: tt?.posts ?? 0, color: "#69C9D0" },
          { name: "Instagram", value: ig?.posts ?? 0, color: IG_COLOR },
        ]
      : [];

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <SkeletonStyle />
      <Sidebar />

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Analytics</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Performa konten via Zernio</p>
            <div className="flex gap-1.5 mt-3 p-1 rounded-xl w-fit" style={{ background: "#111113", border: "1px solid #ffffff0a" }}>
              {PROFILES.map(p => {
                const active = activeProfile === p.id;
                return (
                  <button key={p.id} onClick={() => { setActiveProfile(p.id); localStorage.setItem("vf_profile", p.id); }}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
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
          <div className="flex gap-1 border border-white/[0.06] rounded-lg p-1" style={{ background: "#111113" }}>
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                style={{
                  background: days === d ? "#6366f1" : "transparent",
                  color: days === d ? "white" : "#71717a",
                }}
              >
                {d}H
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            {/* Stat card skeletons */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "#111113", border: "1px solid #ffffff06" }}>
                  <Sk h={10} w="60%" rounded={5} />
                  <Sk h={22} w="75%" rounded={6} />
                </div>
              ))}
            </div>
            {/* Chart skeleton */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#111113", border: "1px solid #ffffff06" }}>
              <Sk h={12} w="25%" rounded={5} />
              <Sk h={180} rounded={10} />
            </div>
            {/* Platform skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map(i => (
                <div key={i} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#111113", border: "1px solid #ffffff06" }}>
                  <Sk h={14} w="40%" rounded={6} />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }, (_, j) => (
                      <div key={j} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "#0a0a0a" }}>
                        <Sk h={10} w="60%" rounded={4} />
                        <Sk h={18} w="50%" rounded={5} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {data?.errors && (
          <div className="flex flex-col gap-1 mb-4">
            {Object.entries(data.errors).map(([k, v]) =>
              v ? (
                <p key={k} className="text-xs text-red-400 bg-red-950 rounded px-3 py-1">
                  ⚠ {k}: {v}
                </p>
              ) : null
            )}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard label="Total Posts" value={fmt(totalPosts)} />
              <StatCard label="Total Likes" value={fmt(totalLikes)} />
              <StatCard label="Total Views" value={fmt(totalViews)} />
              <StatCard label="Total Reach" value={fmt(totalReach)} />
              <StatCard label="Followers" value={fmt(totalFollowers)} />
              <StatCard
                label="Avg Engagement"
                value={fmtPct(
                  tt?.engagement_rate != null || ig?.engagement_rate != null
                    ? ((tt?.engagement_rate ?? 0) + (ig?.engagement_rate ?? 0)) /
                        ([tt, ig].filter(Boolean).length || 1)
                    : undefined
                )}
              />
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* TikTok */}
              <div className="border border-white/[0.06] rounded-2xl p-5" style={{ background: "#111113" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎵</span>
                  <p className="font-bold text-white">TikTok</p>
                  {tt?.followers != null && (
                    <p className="text-xs text-zinc-500 ml-auto">{fmt(tt.followers)} followers</p>
                  )}
                </div>
                {tt ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">Posts</p>
                      <p className="text-lg font-black text-white">{fmt(tt.posts)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Likes</p>
                      <p className="text-lg font-black text-white">{fmt(tt.likes)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Views</p>
                      <p className="text-lg font-black text-white">{fmt(tt.views)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Reach</p>
                      <p className="text-lg font-black text-white">{fmt(tt.reach)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Comments</p>
                      <p className="text-lg font-black text-white">{fmt(tt.comments)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Engagement</p>
                      <p className="text-lg font-black text-white">{fmtPct(tt.engagement_rate)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-600 text-sm">Tidak ada data TikTok</p>
                )}
              </div>

              {/* Instagram */}
              <div className="border border-white/[0.06] rounded-2xl p-5" style={{ background: "#111113" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📸</span>
                  <p className="font-bold text-white">Instagram</p>
                  {ig?.followers != null && (
                    <p className="text-xs text-zinc-500 ml-auto">{fmt(ig.followers)} followers</p>
                  )}
                </div>
                {ig ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">Posts</p>
                      <p className="text-lg font-black text-white">{fmt(ig.posts)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Likes</p>
                      <p className="text-lg font-black text-white">{fmt(ig.likes)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Views</p>
                      <p className="text-lg font-black text-white">{fmt(ig.views)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Reach</p>
                      <p className="text-lg font-black text-white">{fmt(ig.reach)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Comments</p>
                      <p className="text-lg font-black text-white">{fmt(ig.comments)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Engagement</p>
                      <p className="text-lg font-black text-white">{fmtPct(ig.engagement_rate)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-600 text-sm">Tidak ada data Instagram</p>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Line chart */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="font-bold text-white text-sm mb-1">Tren Views</p>
                <p className="text-xs text-zinc-500 mb-4">{days} hari terakhir</p>
                {daily.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={daily}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#52525b", fontSize: 10 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis tick={{ fill: "#52525b", fontSize: 10 }} tickFormatter={fmt} />
                      <Tooltip
                        contentStyle={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#a1a1aa" }}
                        itemStyle={{ color: "#e4e4e7" }}
                        formatter={(v: number) => fmt(v)}
                      />
                      <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="likes" stroke={IG_COLOR} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
                    Tidak ada data time-series
                  </div>
                )}
              </div>

              {/* Donut chart */}
              <div className="border border-white/[0.06] rounded-2xl p-5" style={{ background: "#111113" }}>
                <p className="font-bold text-white text-sm mb-1">Distribusi Posts</p>
                <p className="text-xs text-zinc-500 mb-4">{(totalPosts ?? 0)} posts total</p>
                {distData.length > 0 && totalPosts ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={distData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {distData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{v}</span>}
                      />
                      <Tooltip
                        contentStyle={{ background: "#111113", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number, name: string) => [`${v} posts`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
                    Tidak ada data
                  </div>
                )}
              </div>

              {/* Engagement bar */}
              <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="font-bold text-white text-sm mb-4">Engagement Rate per Platform</p>
                <div className="flex flex-col gap-4">
                  {[
                    { name: "TikTok", rate: tt?.engagement_rate, color: "#69C9D0" },
                    { name: "Instagram", rate: ig?.engagement_rate, color: IG_COLOR },
                  ].map(({ name, rate, color }) => (
                    <div key={name} className="flex items-center gap-4">
                      <p className="text-sm text-zinc-300 w-24 flex-shrink-0">{name}</p>
                      <div className="flex-1 rounded-full h-2" style={{ background: "#ffffff10" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: rate ? `${Math.min(rate, 100)}%` : "0%", background: color }}
                        />
                      </div>
                      <p className="text-sm font-bold text-white w-16 text-right">{fmtPct(rate)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Terbaru */}
            {data.recentPosts && data.recentPosts.length > 0 && (
              <div className="mt-4 border border-white/[0.06] rounded-2xl overflow-hidden" style={{ background: "#111113" }}>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-bold text-white">Post Terbaru</p>
                  <p className="text-xs text-zinc-600">{data.recentPosts.length} posts ditampilkan</p>
                </div>
                <div className="px-5 py-2">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 gap-y-0 items-center py-2 border-b border-white/[0.04]">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest col-span-2">Platform / Konten</p>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest text-right">Likes</p>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest text-right">Views</p>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest text-right">Reach</p>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest text-right"></p>
                  </div>
                  {data.recentPosts.map((post, i) => {
                    const isIG = post.platform?.toLowerCase().includes("instagram");
                    const isTT = post.platform?.toLowerCase() === "tiktok";
                    const isYT = post.platform?.toLowerCase().includes("youtube");
                    const platformIcon = isIG ? "📸" : isTT ? "🎵" : isYT ? "▶️" : "📱";
                    const dateStr = new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                    const caption = post.content?.replace(/#\S+/g, "").trim() || "(no caption)";
                    const hashtags = (post.content?.match(/#\S+/g) ?? []).slice(0, 3).join(" ");
                    return (
                      <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 items-center py-3 border-b border-white/[0.03] last:border-0">
                        {/* Platform + thumb */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{platformIcon}</span>
                          {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex-shrink-0" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-200 truncate leading-snug">{caption}</p>
                          <p className="text-[11px] mt-0.5">
                            <span className="text-zinc-600">{dateStr}</span>
                            {post.engagementRate > 0 && (
                              <span className="ml-2 font-semibold" style={{ color: post.engagementRate > 10 ? "#22c55e" : post.engagementRate > 3 ? "#facc15" : "#71717a" }}>
                                {post.engagementRate.toFixed(2)}% eng.
                              </span>
                            )}
                            {hashtags && <span className="ml-2 text-zinc-700 truncate">{hashtags}</span>}
                          </p>
                        </div>
                        {/* Stats */}
                        <p className="text-sm font-semibold text-zinc-300 text-right tabular-nums">{fmt(post.likes)}</p>
                        <p className="text-sm font-semibold text-zinc-300 text-right tabular-nums">{fmt(post.views)}</p>
                        <p className="text-sm font-semibold text-zinc-300 text-right tabular-nums">{fmt(post.reach)}</p>
                        {/* External link */}
                        <div>
                          {post.platformPostUrl ? (
                            <a href={post.platformPostUrl} target="_blank" rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-zinc-300 transition-colors">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                          ) : <span className="w-4 inline-block" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
