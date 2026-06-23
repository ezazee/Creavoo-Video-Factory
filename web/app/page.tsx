"use client";

import { useState } from "react";

type Step = "idle" | "generating" | "rendering" | "done" | "error";

type SceneData = {
  videoTitle: string;
  subtitle: string;
  introEmoji: string;
  accent: string;
  tips: { title: string; subtitle: string; emoji: string }[];
  ctaText: string;
  scenes: { id: string; text: string }[];
};

const STEPS = [
  { key: "generating", label: "Generating script dengan AI" },
  { key: "rendering", label: "Render video (5-10 menit)" },
  { key: "done", label: "Video siap!" },
];

const ACCENT_OPTIONS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "VS Code", value: "#007ACC" },
];

export default function Home() {
  const [topic, setTopic] = useState("");
  const [accent, setAccent] = useState("#6366f1");
  const [step, setStep] = useState<Step>("idle");
  const [runId, setRunId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SceneData | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setStep("generating");
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, accent }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: SceneData = await res.json();
      setPreview(data);

      setStep("rendering");
      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!renderRes.ok) throw new Error(await renderRes.text());
      const { runId: id } = await renderRes.json();
      setRunId(id);

      // Poll status
      pollStatus(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi error");
      setStep("error");
    }
  };

  const pollStatus = async (id: number) => {
    const poll = async () => {
      const res = await fetch(`/api/status?runId=${id}`);
      const data = await res.json();
      if (data.status === "completed" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStep("done");
      } else if (data.status === "failed") {
        setError("Render gagal. Cek GitHub Actions untuk detail.");
        setStep("error");
      } else {
        setTimeout(poll, 15000);
      }
    };
    setTimeout(poll, 20000);
  };

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-2">Video Factory</h1>
          <p className="text-zinc-400">Tulis topik → dapat video pendek dev konten</p>
        </div>

        {/* Form */}
        {step === "idle" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-300">Topik video</label>
              <textarea
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                rows={3}
                placeholder="Contoh: 5 tips Python untuk pemula&#10;5 Git commands yang jarang diketahui&#10;5 React hooks yang wajib dikuasai"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-300">Warna accent</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAccent(opt.value)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-all"
                    style={{
                      borderColor: accent === opt.value ? opt.value : "#3f3f46",
                      background: accent === opt.value ? `${opt.value}22` : "transparent",
                      color: accent === opt.value ? opt.value : "#a1a1aa",
                    }}
                  >
                    <span
                      className="rounded-full w-3 h-3 inline-block"
                      style={{ background: opt.value }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!topic.trim()}
              className="rounded-xl py-4 font-black text-white text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: accent, boxShadow: `0 8px 30px ${accent}66` }}
            >
              Generate Video →
            </button>
          </div>
        )}

        {/* Progress */}
        {(step === "generating" || step === "rendering") && (
          <div className="flex flex-col gap-6">
            {STEPS.map((s, i) => {
              const isDone = i < currentStepIdx;
              const isActive = i === currentStepIdx;
              return (
                <div key={s.key} className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: isDone ? "#22c55e" : isActive ? accent : "#27272a",
                      color: isDone || isActive ? "white" : "#52525b",
                    }}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span
                    className="font-medium"
                    style={{ color: isActive ? "white" : isDone ? "#22c55e" : "#52525b" }}
                  >
                    {s.label}
                    {isActive && (
                      <span className="ml-2 inline-block animate-pulse">...</span>
                    )}
                  </span>
                </div>
              );
            })}

            {preview && (
              <div
                className="rounded-2xl p-5 border mt-2"
                style={{ background: `${accent}10`, borderColor: `${accent}30` }}
              >
                <p className="font-black text-white text-lg mb-1">{preview.videoTitle}</p>
                <p className="text-zinc-400 text-sm mb-3">{preview.subtitle}</p>
                <div className="flex flex-col gap-1">
                  {preview.tips.map((tip, i) => (
                    <p key={i} className="text-zinc-300 text-sm">
                      <span className="font-bold" style={{ color: accent }}>{i + 1}.</span>{" "}
                      {tip.emoji} {tip.title}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {step === "rendering" && runId && (
              <p className="text-zinc-500 text-sm text-center">
                GitHub Actions run #{runId} sedang berjalan.{" "}
                <a
                  href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}/actions`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-zinc-400"
                >
                  Lihat progress
                </a>
              </p>
            )}
          </div>
        )}

        {/* Done */}
        {step === "done" && videoUrl && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl font-black text-white text-center">
              🎉 {preview?.videoTitle}
            </p>

            {/* Video player */}
            <div className="w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black" style={{ aspectRatio: "9/16", maxHeight: 500 }}>
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                style={{ background: "#000" }}
              />
            </div>

            <div className="flex gap-3 w-full">
              <a
                href={videoUrl}
                download="video.mp4"
                className="flex-1 rounded-xl py-3 font-black text-white text-center"
                style={{ background: accent, boxShadow: `0 6px 20px ${accent}66` }}
              >
                Download MP4
              </a>
              <button
                onClick={() => {
                  setStep("idle");
                  setTopic("");
                  setPreview(null);
                  setVideoUrl(null);
                  setRunId(null);
                }}
                className="rounded-xl py-3 px-6 font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Buat baru
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">❌</div>
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => { setStep("idle"); setError(null); }}
              className="rounded-xl py-3 px-8 font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
