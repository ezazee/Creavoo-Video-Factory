import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

function loadCreavooKnowledge(): string {
  try {
    const filePath = path.join(process.cwd(), "knowledge", "creavoo-knowledge.md");
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function fetchGoogleTrends(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://trends.google.com/trending/rss?geo=ID",
      { next: { revalidate: 1800 } }
    );
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)]
      .map((m) => m[1])
      .filter((t) => !t.includes("Google Trends"))
      .slice(0, 20);
    return titles;
  } catch {
    return [];
  }
}

export async function GET() {
  // Step 1: baca knowledge Creavoo dulu
  const knowledge = loadCreavooKnowledge();

  // Step 2: scrape Google Trends Indonesia
  const trends = await fetchGoogleTrends();

  // Step 3: AI suggest topik yang relevan dengan domain Creavoo + trend Google
  const knowledgeContext = knowledge
    ? `\n\n## KNOWLEDGE PRODUK CREAVOO (baca dulu sebelum suggest topik):\n${knowledge}\n\n---\n`
    : "";

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? "creavoo-combo",
    messages: [
      {
        role: "system",
        content: `Kamu adalah content strategist untuk Creavoo — platform AI social media growth untuk creator Indonesia.${knowledgeContext}
Tugasmu: suggest 6 ide topik konten video pendek (TikTok/Reels/YouTube Shorts) yang:
1. Relevan dengan domain Creavoo: social media growth, content creation, AI tools, creator economy, TikTok/Instagram/YouTube
2. Bisa connect dengan trending di Indonesia saat ini
3. Menggunakan pain points dan use cases yang ada di knowledge Creavoo
4. Format cocok untuk "5 tips / explained / hidden gems / mistakes / beginner-vs-pro / tutorial"

Format output: JSON array of strings, masing-masing topik maksimal 60 karakter. Hanya JSON, tanpa markdown.`,
      },
      {
        role: "user",
        content: trends.length > 0
          ? `Trending di Indonesia saat ini: ${trends.slice(0, 10).join(", ")}\n\nBuat 6 ide topik video yang relevan dengan Creavoo dan bisa connect dengan trend atau momen ini.`
          : `Buat 6 ide topik video yang relevan dengan domain Creavoo (social media growth, content creation, AI tools) untuk audiens creator Indonesia.`,
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

  // Fallback topics sesuai domain Creavoo
  if (topics.length === 0) {
    topics = [
      "5 alasan akun TikTok kamu stuck di sini terus",
      "Cara audit akun Instagram sendiri dalam 5 menit",
      "Kesalahan creator pemula yang bikin konten ga viral",
      "Tips posting di waktu yang tepat agar reach meledak",
      "Cara clone konten viral tanpa nyontek",
      "5 tanda akun sosmedmu butuh strategi baru",
    ];
  }

  return NextResponse.json({ topics: topics.slice(0, 6), trends: trends.slice(0, 5) });
}
