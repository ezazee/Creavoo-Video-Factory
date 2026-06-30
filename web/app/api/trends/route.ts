import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

const TAVILY_KEY = process.env.TAVILY_API_KEY ?? "";

function loadCreavooKnowledge(): string {
  try {
    const filePath = path.join(process.cwd(), "knowledge", "creavoo-knowledge.md");
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function getThemeQueries(year: number): Record<string, string> {
  return {
    "it-developer": `trending programming web development tech stack ${year}`,
    "ai":           `trending AI tools artificial intelligence use cases ${year}`,
    "design":       `trending UI UX design tools figma ${year}`,
    "tips-trick":   `trending IT productivity tips developer tricks ${year}`,
  };
}

const THEME_LABELS: Record<string, string> = {
  "it-developer": "IT Developer (web dev, coding, tech stack)",
  "ai":           "AI (tools AI, tips AI, use case AI)",
  "design":       "Design (UI UX, vector, design tools)",
  "tips-trick":   "Tips & Trick (IT, design, AI productivity)",
};

async function tavilySearch(query: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        search_depth: "basic",
        max_results: 8,
        include_answer: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: { title: string; content?: string }[] = data.results ?? [];
    return results
      .slice(0, 8)
      .map((r) => r.title + (r.content ? ` — ${r.content.slice(0, 80)}` : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const contentTheme = req.nextUrl.searchParams.get("contentTheme") ?? "it-developer";
  const isZaportfolio = profile === "zaportfolio";
  const currentYear = new Date().getFullYear();
  const THEME_QUERIES = getThemeQueries(currentYear);

  const [searchResults, knowledge] = await Promise.all([
    isZaportfolio
      ? tavilySearch(THEME_QUERIES[contentTheme] ?? THEME_QUERIES["it-developer"])
      : Promise.all([
          tavilySearch(`trending social media content creator tips Indonesia ${currentYear}`),
          tavilySearch(`viral konten TikTok Instagram creator growth ${currentYear}`),
        ]).then(([r1, r2]) => [...r1, ...r2]),
    isZaportfolio ? Promise.resolve("") : Promise.resolve(loadCreavooKnowledge()),
  ]);

  const knowledgeContext = knowledge
    ? `\n\n## KNOWLEDGE PRODUK CREAVOO:\n${knowledge}\n\n---\n`
    : "";

  const themeLabel = isZaportfolio
    ? `Tema konten: **${THEME_LABELS[contentTheme] ?? contentTheme}**`
    : "Platform: Creavoo — social media growth & content creation untuk creator Indonesia";

  const searchContext = searchResults.length > 0
    ? `\nHasil pencarian terbaru dari internet (${currentYear}):\n${searchResults.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "";

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? "creavoo-combo",
    messages: [
      {
        role: "system",
        content: `Kamu adalah content strategist untuk video pendek (Reels/Shorts).${knowledgeContext}
${themeLabel}

Tahun sekarang adalah ${currentYear}.

Tugasmu: suggest 6 ide topik konten video pendek yang:
1. Relevan dengan tema di atas
2. Berdasarkan tren aktual ${currentYear} dari hasil pencarian internet
3. Format cocok untuk "5 tips / explained / hidden gems / mistakes / tutorial / beginner vs pro"
4. Audiens: developer/kreator Indonesia

PENTING — WAJIB FULL BAHASA INDONESIA:
- Topik HARUS 100% bahasa Indonesia, TIDAK BOLEH ada kata bahasa Inggris
- Terjemahkan semua istilah teknis ke bahasa Indonesia atau gunakan padanannya
- Contoh yang SALAH: "5 AI tools gratis yang wajib dicoba" — mengandung kata Inggris
- Contoh yang BENAR: "Lima alat AI gratis yang wajib dicoba developer"
- Nama brand/produk boleh tetap (TikTok, Instagram, GitHub, dll)
- Jika menyebut tahun, gunakan ${currentYear}

Format output: JSON array of strings, masing-masing topik maksimal 65 karakter. Hanya JSON, tanpa markdown.`,
      },
      {
        role: "user",
        content: `${searchContext}\n\nBuat 6 ide topik video pendek yang relevan dan trending di ${currentYear}. INGAT: semua topik HARUS full bahasa Indonesia, tidak boleh ada kata bahasa Inggris selain nama brand/produk.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 500,
  });

  const raw = completion.choices[0].message.content ?? "[]";
  let topics: string[] = [];

  try {
    const clean = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) topics = parsed.filter((t) => typeof t === "string");
    else if (parsed.topics) topics = parsed.topics;
  } catch {
    const matches = raw.match(/"([^"]{10,80})"/g);
    if (matches) topics = matches.map((s) => s.slice(1, -1)).slice(0, 6);
  }

  if (topics.length === 0) {
    topics = isZaportfolio ? [
      `Lima alat kecerdasan buatan gratis wajib dicoba developer ${currentYear}`,
      "Cara belajar pemrograman lebih cepat dengan bantuan AI",
      "Tumpukan teknologi terbaik untuk pengembang web tahun ini",
      "Lima tips desain antarmuka yang bikin aplikasimu terlihat profesional",
      "Kesalahan desainer pemula saat bikin halaman arahan",
      "Cara pakai GitHub Copilot supaya produktivitas coding naik tiga kali",
    ] : [
      "Lima alasan akun TikTok kamu stuck dan cara fixnya",
      "Cara audit akun Instagram sendiri dalam lima menit",
      "Kesalahan kreator pemula yang bikin konten ga viral",
      "Tips posting di waktu yang tepat agar jangkauan meledak",
      "Cara duplikasi konten viral tanpa meniru",
      "Lima tanda akun sosialmu butuh strategi baru",
    ];
  }

  return NextResponse.json({ topics: topics.slice(0, 6), searchResults: searchResults.slice(0, 5) });
}
