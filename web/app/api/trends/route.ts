import { NextRequest, NextResponse } from "next/server";

const TAVILY_KEY = process.env.TAVILY_API_KEY ?? "";

function getThemeQueries(year: number): Record<string, string> {
  return {
    "it-developer": `trending programming web development tech stack ${year}`,
    "ai":           `trending AI tools artificial intelligence use cases ${year}`,
    "design":       `trending UI UX design tools figma ${year}`,
    "tips-trick":   `trending IT productivity tips developer tricks ${year}`,
  };
}


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

const FALLBACK_TOPICS: Record<string, string[]> = {
  "zaportfolio": [
    "Lima alat AI gratis wajib dicoba developer tahun ini",
    "Cara belajar coding lebih cepat dengan bantuan AI",
    "Tech stack terbaik untuk web developer tahun ini",
    "Lima tips UI yang bikin aplikasimu terlihat profesional",
    "Kesalahan developer pemula saat bikin landing page",
    "Cara pakai GitHub Copilot agar produktivitas naik",
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

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const contentTheme = req.nextUrl.searchParams.get("contentTheme") ?? "it-developer";
  const isZaportfolio = profile === "zaportfolio";
  const currentYear = new Date().getFullYear();
  const THEME_QUERIES = getThemeQueries(currentYear);

  const searchResults = await (isZaportfolio
    ? tavilySearch(THEME_QUERIES[contentTheme] ?? THEME_QUERIES["it-developer"])
    : tavilySearch(`trending konten kreator TikTok Instagram Indonesia ${currentYear}`));

  // Use Tavily titles directly as topic suggestions, fallback to hardcoded
  const topics = searchResults.length >= 3
    ? searchResults.slice(0, 6).map(t => t.split(" — ")[0].slice(0, 65))
    : (FALLBACK_TOPICS[profile] ?? FALLBACK_TOPICS["creavoo"]);

  return NextResponse.json({ topics: topics.slice(0, 6), searchResults: searchResults.slice(0, 5) });
}
