import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export const maxDuration = 30;

// Test koneksi AI — dipanggil dari halaman Settings.
// `overrides` opsional: test pakai draft yang belum di-Simpan, tanpa tersimpan permanen.
export async function POST(req: NextRequest) {
  const { type, overrides } = await req.json();
  const saved = await loadConfig();
  const c = { ...saved, ...(overrides ?? {}) };

  try {
    if (type === "ai") {
      if (!c.aiBaseUrl || !c.aiApiKey) throw new Error("AI base URL / API key belum diisi");
      const res = await fetch(`${c.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${c.aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: c.aiModel, messages: [{ role: "user", content: "Balas: OK" }], max_tokens: 10 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 120)}`);
      return NextResponse.json({ ok: true, message: `Model ${c.aiModel} merespons` });
    }

    if (type === "ai-models") {
      if (!c.aiBaseUrl || !c.aiApiKey) throw new Error("AI base URL / API key belum diisi");
      const res = await fetch(`${c.aiBaseUrl.replace(/\/$/, "")}/models`, {
        headers: { Authorization: `Bearer ${c.aiApiKey}` }, cache: "no-store",
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const d = await res.json();
      const models: string[] = (d.data ?? []).map((m: { id: string }) => m.id);
      return NextResponse.json({ ok: true, models });
    }

    throw new Error(`Unknown test type: ${type}`);
  } catch (e) {
    return NextResponse.json({ ok: false, message: String(e instanceof Error ? e.message : e) }, { status: 200 });
  }
}
