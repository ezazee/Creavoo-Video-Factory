import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

const FALLBACK_TOPICS: Record<string, string[]> = {
  "zaportfolio": [
    "Lima alat AI gratis wajib dicoba developer tahun ini",
    "Cara belajar coding lebih cepat dengan bantuan AI",
    "Lima tips UI yang bikin aplikasimu terlihat profesional",
    "Kesalahan developer pemula saat bikin landing page",
    "Cara pakai GitHub Copilot agar produktivitas naik",
    "Tech stack terbaik untuk web developer tahun ini",
  ],
  "creavoo": [
    "Lima alasan akun TikTok kamu stuck dan cara fixnya",
    "Cara audit akun Instagram sendiri dalam lima menit",
    "Kesalahan kreator pemula yang bikin konten ga viral",
    "Tips posting di waktu yang tepat agar jangkauan meledak",
    "Cara duplikasi konten viral tanpa meniru",
    "Lima tanda akun sosialmu butuh strategi baru",
  ],
};

const THEME_CONTEXT: Record<string, string> = {
  "it-developer": "tips coding, web development, tools developer, karir IT",
  "ai":           "AI tools, penggunaan AI untuk developer, produktivitas dengan AI",
  "design":       "UI UX design, Figma, design system, visual branding",
  "tips-trick":   "produktivitas IT, shortcut developer, workflow programming",
};

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const contentTheme = req.nextUrl.searchParams.get("contentTheme") ?? "it-developer";
  const isZaportfolio = profile === "zaportfolio";
  const currentYear = new Date().getFullYear();

  const context = isZaportfolio
    ? `Niche: ${THEME_CONTEXT[contentTheme] ?? "tips developer Indonesia"}`
    : "Niche: social media growth, konten kreator, TikTok & Instagram Indonesia";

  try {
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "creavoo-combo",
      messages: [
        {
          role: "system",
          content: `Kamu content strategist video pendek. ${context}. Tahun: ${currentYear}. Balas HANYA JSON array 6 string, masing-masing ide topik video max 60 karakter, bahasa Indonesia.`,
        },
        {
          role: "user",
          content: `Beri 6 ide topik video pendek yang relevan dan menarik untuk ${currentYear}. Hanya JSON array, tanpa penjelasan.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content ?? "[]";
    const clean = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(clean);
    const topics: string[] = Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];

    if (topics.length >= 3) {
      return NextResponse.json({ topics: topics.slice(0, 6) });
    }
  } catch { /* fallback */ }

  return NextResponse.json({ topics: FALLBACK_TOPICS[profile] ?? FALLBACK_TOPICS["creavoo"] });
}
