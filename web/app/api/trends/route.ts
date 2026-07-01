import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

const FAST_MODEL = "cf/@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const TAVILY_KEY = process.env.TAVILY_API_KEY ?? "";

const THEME_QUERIES: Record<string, string> = {
  "it-developer": "trending programming web development tips Indonesia 2026",
  "ai":           "trending AI tools productivity developer Indonesia 2026",
  "design":       "trending UI UX design Figma tips Indonesia 2026",
  "tips-trick":   "trending developer productivity shortcuts tools Indonesia 2026",
  "creavoo":      "trending tips viral TikTok Instagram Reels content creator strategy Indonesia 2026",
};

const FALLBACK_TOPICS: Record<string, string[]> = {
  "it-developer": [
    "Lima alat AI gratis wajib dicoba developer tahun ini",
    "Cara belajar coding lebih cepat dengan bantuan AI",
    "Lima tips UI yang bikin aplikasimu terlihat profesional",
    "Kesalahan developer pemula saat bikin landing page",
    "Cara pakai GitHub Copilot agar produktivitas naik",
    "Tech stack terbaik untuk web developer tahun ini",
  ],
  "ai": [
    "Lima alat AI yang bikin kerja developer 10x lebih cepat",
    "Cara pakai AI untuk otomasi tugas sehari-hari",
    "Kesalahan umum saat pakai AI dalam proyek coding",
    "Prompt engineering yang efektif untuk developer",
    "AI tools gratis terbaik untuk programmer Indonesia",
    "Cara integrasikan AI API ke aplikasi web kamu",
  ],
  "design": [
    "Lima prinsip UI yang bikin desain terlihat profesional",
    "Cara bikin design system yang konsisten di Figma",
    "Kesalahan desainer pemula saat bikin landing page",
    "Tips typography yang bikin konten lebih mudah dibaca",
    "Cara pakai AI untuk mempercepat proses desain",
    "Lima plugin Figma yang wajib dipakai designer",
  ],
  "tips-trick": [
    "Lima shortcut keyboard yang bikin coding lebih cepat",
    "Cara setup terminal yang produktif untuk developer",
    "Tips manajemen waktu untuk developer yang sibuk",
    "Cara pakai Git dengan lebih efisien setiap hari",
    "Lima ekstensi VS Code yang wajib dipasang developer",
    "Cara debug kode lebih cepat dengan teknik ini",
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

async function tavilySearch(query: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: "basic", max_results: 5 }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const results: { title: string }[] = data.results ?? [];
    return results.map((r) => r.title).slice(0, 5).join(". ");
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const contentTheme = req.nextUrl.searchParams.get("contentTheme") ?? "it-developer";
  const isZaportfolio = profile === "zaportfolio";
  const fallbackKey = isZaportfolio ? contentTheme : "creavoo";
  const themeKey = isZaportfolio ? contentTheme : "creavoo";
  const currentYear = new Date().getFullYear();

  // Tavily dan AI jalan parallel — ambil search context dulu (biasanya lebih cepat)
  const searchContext = await tavilySearch(THEME_QUERIES[themeKey] ?? THEME_QUERIES["creavoo"]);

  const trendContext = searchContext
    ? `Tren terbaru dari internet: ${searchContext.slice(0, 400)}\n\n`
    : "";

  let brandContext: string;
  if (isZaportfolio) {
    brandContext = "Akun developer Indonesia (tips coding, karir IT, tools developer).";
  } else {
    try {
      const knowledgePath = path.join(process.cwd(), "knowledge", "creavoo-knowledge.md");
      const raw = fs.readFileSync(knowledgePath, "utf-8");
      // Ambil 80 baris pertama — cukup untuk konteks brand tanpa bikin prompt besar
      brandContext = raw.split("\n").slice(0, 80).join("\n");
    } catch {
      brandContext = "Akun Creavoo — bantu kreator Indonesia tumbuh di TikTok & Instagram (strategi konten, algoritma, engagement, caption, hashtag, jadwal posting).";
    }
  }

  try {
    const completion = await client.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        {
          role: "user",
          content: `${trendContext}Konteks: ${brandContext}\n\nBuat 6 ide topik video pendek tahun ${currentYear} yang relevan dengan konteks di atas. Balas HANYA JSON array 6 string bahasa Indonesia, max 60 karakter per topik. Contoh: ["topik 1","topik 2"]`,
        },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content ?? "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const topics: string[] = Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
      if (topics.length >= 3) return NextResponse.json({ topics: topics.slice(0, 6) });
    }
  } catch { /* fallback */ }

  return NextResponse.json({ topics: FALLBACK_TOPICS[fallbackKey] ?? FALLBACK_TOPICS["creavoo"] });
}
