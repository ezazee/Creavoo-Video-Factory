import { NextRequest, NextResponse } from "next/server";
import { loadConfig, saveConfig, type AppConfig } from "@/lib/config";

// Mask nilai sensitif untuk ditampilkan di UI: "sk_08...a8dd"
function mask(v: string): string {
  if (!v) return "";
  if (v.length <= 10) return "•".repeat(v.length);
  return `${v.slice(0, 5)}…${v.slice(-4)}`;
}

const SECRET_FIELDS: (keyof AppConfig)[] = [
  "aiApiKey", "zernioKeyCreavoo", "zernioKeyZaportfolio", "telegramBotToken", "tavilyApiKey",
];

export async function GET() {
  const c = await loadConfig();
  const masked = { ...c };
  for (const f of SECRET_FIELDS) masked[f] = mask(c[f]);
  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const body: Partial<AppConfig> = await req.json();
  // Field bernilai masked (mengandung …/•) atau kosong = tidak diubah user, jangan ditimpa
  const clean: Partial<AppConfig> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v !== "string") continue;
    if (v.includes("…") || v.includes("•")) continue;
    clean[k as keyof AppConfig] = v;
  }
  await saveConfig(clean);
  return NextResponse.json({ ok: true });
}
