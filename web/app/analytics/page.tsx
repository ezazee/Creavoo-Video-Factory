"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type AnalyticsData = {
  tiktok: PlatformStats | null;
  instagram: PlatformStats | null;
  daily: DailyMetric[] | null;
  errors: { tiktok: string | null; instagram: string | null; daily: string | null };
};

const TIKTOK_COLOR = "#010101";
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
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

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [days]);

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
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-base font-black text-white">Video Factory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Dev shorts generator</p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <span className="text-base">🎬</span> Generate
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white bg-zinc-800 font-medium"
          >
            <span className="text-base">📊</span> Analytics
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Analytics</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Performa konten via Zernio</p>
          </div>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
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
          <div className="flex items-center justify-center h-64 text-zinc-500">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" />
            Loading data...
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
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
                      <div className="flex-1 bg-zinc-800 rounded-full h-2">
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
          </>
        )}
      </main>
    </div>
  );
}
