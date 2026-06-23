import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

const TEMPLATE_LAYOUT: Record<string, "center" | "side" | "bold"> = {
  "5-tips": "center",
  "explained": "bold",
  "mistakes": "bold",
  "beginner-vs-pro": "side",
  "hidden-gems": "side",
  "tutorial": "side",
};

const TEMPLATE_GUIDES: Record<string, string> = {
  "5-tips": `Format: intro + 5 tips praktis + outro. Tiap tip harus spesifik, actionable, dan langsung bisa dipake. Judul tip mulai dengan kata kerja (Gunakan, Hindari, Aktifkan, dll).`,
  "explained": `Format: intro + kenapa penting + apa itu + cara kerja + contoh nyata + kapan dipakai + outro. Jelasin dari konsep paling dasar, pakai analogi yang mudah dipahami.`,
  "mistakes": `Format: intro + 5 kesalahan umum + outro. Tiap scene: sebutin kesalahannya dulu, jelasin kenapa salah, terus kasih solusi yang bener. Bikin penonton relate.`,
  "beginner-vs-pro": `Format: intro + 5 perbandingan cara berpikir/kerja pemula vs pro + outro. Tiap scene kontraskan satu kebiasaan/pola pikir. Jangan menghakimi pemula, fokus ke pertumbuhan.`,
  "hidden-gems": `Format: intro + 5 hal tersembunyi/tips yang jarang diketahui + outro. Tiap hal harus bener-bener jarang diketahui orang. Mulai dengan "Tahukah kamu..." atau "Banyak yang ga tahu...".`,
  "tutorial": `Format: intro + 5 langkah berurutan + outro. Tiap langkah harus jelas urutannya dan saling nyambung. Pakai kata "Pertama", "Kedua", dll di narasi.`,
};

function loadCreavooKnowledge(): string {
  try {
    const filePath = path.join(process.cwd(), "knowledge", "creavoo-knowledge.md");
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function buildSystemPrompt(template: string, knowledge: string): string {
  const guide = TEMPLATE_GUIDES[template] ?? TEMPLATE_GUIDES["5-tips"];

  const knowledgeBlock = knowledge
    ? `\n\n---\n## KNOWLEDGE PRODUK CREAVOO (baca ini dulu, jadikan landasan script):\n\n${knowledge}\n\n---\n\n`
    : "\n\n";

  return `Kamu adalah content creator yang bikin script video pendek viral untuk TikTok/Instagram Reels/YouTube Shorts.${knowledgeBlock}${guide}

Gunakan knowledge Creavoo di atas sebagai:
- Sumber fakta, angka, dan use case yang akurat
- Panduan tone dan voice (friendly, bahasa Indonesia casual, empati dulu baru solusi)
- Konteks pain points yang relevan untuk audiens creator Indonesia
- Referensi fitur Creavoo jika topik relevan (tapi jangan hard-sell, biarkan natural)

Kamu HARUS mengembalikan JSON valid (tanpa markdown, hanya JSON murni):
{
  "videoTitle": "string (maks 45 karakter, catchy, pakai angka jika relevan)",
  "subtitle": "string (maks 65 karakter, hook yang bikin penasaran dan scroll-stop)",
  "introEmoji": "string (1 emoji yang paling relevan dengan topik)",
  "accent": "string (pilih hex color yang paling cocok dengan vibe topik: #6366f1 #3b82f6 #22c55e #f97316 #ec4899 #00AEEF #eab308 #ef4444)",
  "tips": [
    {
      "title": "string (maks 35 karakter, nama tip/poin singkat dan kuat)",
      "subtitle": "string (maks 80 karakter, manfaat atau konteks singkat)",
      "emoji": "string (1 emoji)",
      "bullets": ["string (maks 38 karakter, poin spesifik & punchy)", "string", "string"]
    }
  ],
  "ctaText": "string (maks 50 karakter, ajakan follow/subscribe yang natural)",
  "scenes": [
    { "id": "intro", "text": "string (narasi voiceover intro, 4-6 kalimat, mulai dengan hook pain point yang bikin relate, bahasa Indonesia casual/gaul)" },
    { "id": "tip-1", "text": "string (narasi voiceover poin 1, 4-6 kalimat, spesifik dan informatif)" },
    { "id": "tip-2", "text": "string (4-6 kalimat)" },
    { "id": "tip-3", "text": "string (4-6 kalimat)" },
    { "id": "tip-4", "text": "string (4-6 kalimat)" },
    { "id": "tip-5", "text": "string (4-6 kalimat)" },
    { "id": "outro", "text": "string (narasi outro + CTA, 3-4 kalimat, ajak follow/subscribe dengan alasan yang jelas)" }
  ]
}

Aturan PENTING:
- Bahasa Indonesia casual/gaul tapi tetap mudah dipahami
- Setiap scene harus 4-6 kalimat agar total video 1-2 menit
- Energik, to-the-point, tidak bertele-tele tapi tidak terlalu singkat
- Hindari simbol: # @ & / → tulis sebagai kata
- Angka HARUS ditulis sebagai kata: "lima" bukan "5", "dua puluh" bukan "20"
- Akronim (AI, TikTok, Instagram, API, URL) boleh dipakai as-is
- tips array: TEPAT 5 item, setiap tip punya bullets: TEPAT 3 item (maks 38 karakter, konkrit, no full sentence)
- scenes array: TEPAT 7 item dengan id persis: intro, tip-1, tip-2, tip-3, tip-4, tip-5, outro`;
}

export async function POST(req: NextRequest) {
  const { topic, template = "5-tips" } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  // Step 1: baca knowledge Creavoo dulu
  const knowledge = loadCreavooKnowledge();

  let data = null;
  let lastRaw = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "creavoo-combo",
      messages: [
        { role: "system", content: buildSystemPrompt(template, knowledge) },
        {
          role: "user",
          content: `Buat script video dengan topik: "${topic}"\n\nPENTING: Kembalikan JSON lengkap, jangan dipotong. Pastikan tiap scene punya 4-6 kalimat untuk durasi 1-2 menit. Gunakan knowledge Creavoo sebagai landasan fakta dan tone.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 4000,
    });

    lastRaw = completion.choices[0].message.content ?? "";

    let jsonStr = lastRaw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      const parsed = JSON.parse(jsonStr);
      if (
        parsed.videoTitle &&
        Array.isArray(parsed.tips) && parsed.tips.length === 5 &&
        Array.isArray(parsed.scenes) && parsed.scenes.length === 7
      ) {
        data = parsed;
        break;
      }
    } catch {
      // retry
    }
  }

  if (!data) {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: lastRaw }, { status: 500 });
  }

  data.layout = TEMPLATE_LAYOUT[template] ?? "center";
  data.knowledgeUsed = !!knowledge;

  return NextResponse.json(data);
}
