import { NextRequest, NextResponse } from "next/server";
import { loadConfig, saveConfig, type AiConfig } from "@/lib/config";

// Mask nilai sensitif untuk ditampilkan di UI: "sk_08...a8dd"
function mask(v: string): string {
  if (!v) return "";
  if (v.length <= 10) return "•".repeat(v.length);
  return `${v.slice(0, 5)}…${v.slice(-4)}`;
}

export async function GET() {
  const c = await loadConfig();
  return NextResponse.json({ ...c, aiApiKey: mask(c.aiApiKey) });
}

export async function POST(req: NextRequest) {
  const body: Partial<AiConfig> = await req.json();
  // Field bernilai masked (mengandung …/•) atau kosong = tidak diubah user, jangan ditimpa
  const clean: Partial<AiConfig> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v !== "string" || !v) continue;
    if (v.includes("…") || v.includes("•")) continue;
    clean[k as keyof AiConfig] = v;
  }
  await saveConfig(clean);
  return NextResponse.json({ ok: true });
}
