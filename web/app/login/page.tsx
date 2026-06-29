"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? "Password salah");
      }
    } catch {
      setError("Terjadi error, coba lagi");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"
            style={{ background: "linear-gradient(135deg,#6366f1,#00AEEF)", boxShadow: "0 8px 32px #6366f140" }}>
            V
          </div>
          <div className="text-center">
            <p className="text-white font-black text-lg">Video Factory</p>
            <p className="text-zinc-500 text-xs mt-0.5">by Creavoo</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={login} className="flex flex-col gap-3">
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: "#111113" }}>
            <div className="px-5 py-4">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoFocus
                className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600"
                onKeyDown={e => { if (e.key === "Enter") login(e as unknown as React.FormEvent); }}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg,#6366f1,#00AEEF)",
              boxShadow: password.trim() ? "0 4px 20px #6366f140" : "none",
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Masuk…
              </span>
            ) : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
