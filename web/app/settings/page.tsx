"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

type Config = { aiModel: string; aiBaseUrl: string; aiApiKey: string };
const EMPTY: Config = { aiModel: "", aiBaseUrl: "", aiApiKey: "" };

type TestState = { loading?: boolean; ok?: boolean; message?: string };

function isMasked(v: string): boolean {
  return v.includes("…") || v.includes("•");
}

// Di luar komponen halaman supaya tidak remount tiap ketikan (fokus input aman)
function Field({ label, value, onChange, placeholder, secret }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean;
}) {
  const masked = isMasked(value);
  return (
    <div>
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Field masih tampil mask lama → klik langsung select-all, jadi mengetik atau
        // paste otomatis menggantikan seluruhnya (tidak bisa nyampur sisa mask).
        onFocus={(e) => { if (masked) e.target.select(); }}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none border border-white/[0.07] focus:border-[#00AEEF]/50 transition-colors"
        style={{ background: "#0a0a0a", fontFamily: secret ? "monospace" : undefined }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<TestState>({});
  const [models, setModels] = useState<string[]>([]);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { setConfig(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fieldSet = (k: keyof Config) => (v: string) => setConfig(c => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true); setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      setSaving(false);
      setTest({ ok: false, message: `Gagal menyimpan: ${res.status}` });
      return;
    }
    // Reload untuk dapat nilai masked terbaru dari server
    const d = await fetch("/api/settings").then(r => r.json());
    setConfig(d);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const runTest = async () => {
    setTest({ loading: true });
    try {
      // Kirim field yang sedang diketik user (belum tentu sudah disimpan) sebagai override,
      // supaya "Test" selalu mencerminkan apa yang ada di layar — bukan versi lama.
      const overrides: Partial<Config> = {};
      for (const [k, v] of Object.entries(config)) {
        if (typeof v === "string" && v && !isMasked(v)) overrides[k as keyof Config] = v;
      }
      const res = await fetch("/api/settings/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai", overrides }),
      });
      const d = await res.json();
      setTest({ ok: d.ok, message: d.message });
    } catch (e) {
      setTest({ ok: false, message: String(e) });
    }
  };

  const loadModels = async () => {
    setShowModels(true);
    if (models.length) return;
    const overrides = { aiBaseUrl: config.aiBaseUrl, aiApiKey: config.aiApiKey };
    const res = await fetch("/api/settings/test", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ai-models", overrides }),
    });
    const d = await res.json();
    if (d.ok) setModels(d.models ?? []);
    else setTest({ ok: false, message: d.message });
  };

  const btnTest = "px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/[0.1] text-zinc-300 hover:border-[#00AEEF]/50 hover:text-white transition-colors";

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black">Settings</h1>
              <p className="text-zinc-500 text-sm mt-1">Model AI tersimpan di cloud — berubah langsung tanpa redeploy</p>
            </div>
            <button onClick={save} disabled={saving || loading}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-all"
              style={{ background: saved ? "#22c55e" : "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 4px 16px #6366f130" }}>
              {saving ? "Menyimpan…" : saved ? "✓ Tersimpan" : "Simpan"}
            </button>
          </div>

          {loading ? (
            <p className="text-zinc-600 text-sm">Memuat konfigurasi…</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/[0.07] p-6" style={{ background: "#111113" }}>
                <p className="text-sm font-bold text-white">🤖 AI Model</p>
                <p className="text-xs text-zinc-600 mt-0.5 mb-5">Model & endpoint untuk generate script dan trending topik</p>

                <div className="flex flex-col gap-4">
                  <Field label="Base URL" value={config.aiBaseUrl} onChange={fieldSet("aiBaseUrl")} placeholder="https://creavoo-9router.fly.dev/v1" />
                  <Field label="API Key" value={config.aiApiKey} onChange={fieldSet("aiApiKey")} placeholder="sk-…" secret />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Model</p>
                      <button onClick={loadModels} className="text-[11px] text-[#38bdf8] hover:underline">Lihat model tersedia</button>
                    </div>
                    <input type="text" value={config.aiModel} onChange={(e) => fieldSet("aiModel")(e.target.value)}
                      placeholder="cerebras/gpt-oss-120b" spellCheck={false}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none border border-white/[0.07] focus:border-[#00AEEF]/50 transition-colors font-mono"
                      style={{ background: "#0a0a0a" }} />
                    {showModels && (
                      <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-white/[0.07] p-2 flex flex-wrap gap-1.5" style={{ background: "#0a0a0a" }}>
                        {models.length === 0 ? <p className="text-xs text-zinc-600 p-1">Memuat…</p> : models.map(m => (
                          <button key={m} onClick={() => setConfig(c => ({ ...c, aiModel: m }))}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors"
                            style={{
                              borderColor: config.aiModel === m ? "#00AEEF" : "#ffffff10",
                              color: config.aiModel === m ? "#38bdf8" : "#a1a1aa",
                              background: config.aiModel === m ? "#00AEEF15" : "transparent",
                            }}>{m}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={runTest} className={btnTest}>Test AI</button>
                    {test.loading && <span className="text-[11px] text-zinc-500">⏳ testing…</span>}
                    {!test.loading && test.message && (
                      <span className={`text-[11px] ${test.ok ? "text-green-400" : "text-red-400"}`}>
                        {test.ok ? "✓" : "✗"} {test.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-700 leading-relaxed px-1">
                💡 Field kosong otomatis fallback ke environment variable Vercel (AI_BASE_URL, AI_API_KEY, AI_MODEL).
                Zernio, Telegram, dan Tavily diatur lewat Environment Variables di Vercel dashboard.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
