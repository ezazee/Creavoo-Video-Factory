import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah AI yang membuat script video pendek (short-form) untuk konten developer di TikTok/YouTube Shorts/Instagram Reels.

Format video: intro + 5 tips + outro (total 7 scene).

Kamu HARUS mengembalikan JSON valid dengan struktur ini (tanpa markdown, hanya JSON):
{
  "videoTitle": "string (maks 40 karakter, catchy, pakai angka)",
  "subtitle": "string (maks 60 karakter, hook yang bikin penasaran)",
  "introEmoji": "string (1 emoji yang relevan)",
  "accent": "string (hex color yang cocok dengan tema, pilih dari: #6366f1 #3b82f6 #22c55e #f97316 #ec4899 #007ACC #eab308)",
  "tips": [
    {
      "title": "string (maks 30 karakter, nama tip singkat)",
      "subtitle": "string (maks 70 karakter, penjelasan singkat manfaatnya)",
      "emoji": "string (1 emoji)"
    }
  ],
  "ctaText": "string (maks 50 karakter, ajakan action di akhir)",
  "scenes": [
    { "id": "intro", "text": "string (narasi voiceover intro, 2-3 kalimat, bahasa Indonesia casual)" },
    { "id": "tip-1", "text": "string (narasi voiceover tip 1, 2-3 kalimat)" },
    { "id": "tip-2", "text": "string" },
    { "id": "tip-3", "text": "string" },
    { "id": "tip-4", "text": "string" },
    { "id": "tip-5", "text": "string" },
    { "id": "outro", "text": "string (narasi outro + CTA, 2 kalimat)" }
  ]
}

Aturan narasi voiceover:
- Bahasa Indonesia casual/gaul tapi tetap jelas
- Energik, to-the-point, tidak bertele-tele
- Hindari simbol seperti # @ & — tulis sebagai kata
- Angka tulis sebagai kata: "lima" bukan "5"
- Akronim teknis (API, HTML, CSS, JS) boleh dipakai as-is

Aturan tips array: harus tepat 5 item.`;

export async function POST(req: NextRequest) {
  const { topic, accent } = await req.json();

  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? "creavoo-combo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Buat script video pendek tentang: "${topic}". ${accent ? `Gunakan warna accent: ${accent}` : ""}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const raw = completion.choices[0].message.content ?? "";

  // Strip markdown code blocks if AI wraps in ```json
  const jsonStr = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 500 });
  }

  // Override accent if user picked one
  if (accent) data.accent = accent;

  return NextResponse.json(data);
}
