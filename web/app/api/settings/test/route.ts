import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export const maxDuration = 30;

// Test koneksi per layanan — dipanggil dari halaman Settings
export async function POST(req: NextRequest) {
  const { type, profile } = await req.json();
  const c = await loadConfig();

  try {
    if (type === "telegram") {
      if (!c.telegramBotToken || !c.telegramChatId) throw new Error("Bot token / chat ID belum diisi");
      const res = await fetch(`https://api.telegram.org/bot${c.telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: c.telegramChatId, text: "✅ Test notifikasi dari Video Factory — koneksi OK!" }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.description ?? "Telegram API error");
      return NextResponse.json({ ok: true, message: "Pesan test terkirim ke Telegram" });
    }

    if (type === "zernio") {
      const key = profile === "zaportfolio" ? c.zernioKeyZaportfolio : c.zernioKeyCreavoo;
      if (!key) throw new Error("API key Zernio belum diisi");
      const res = await fetch("https://zernio.com/api/v1/accounts", {
        headers: { Authorization: `Bearer ${key}` }, cache: "no-store",
      });
      if (!res.ok) throw new Error(`Zernio ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const d = await res.json();
      const accounts: { platform?: string; username?: string }[] = Array.isArray(d) ? d : d?.data ?? [];
      const list = accounts.map((a) => `${a.platform}${a.username ? ` (@${a.username})` : ""}`).join(", ");
      return NextResponse.json({ ok: true, message: `${accounts.length} akun terhubung${list ? `: ${list}` : ""}` });
    }

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
