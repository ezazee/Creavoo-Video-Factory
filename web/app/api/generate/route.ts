import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { put, head } from "@vercel/blob";

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

function buildSystemPrompt(useKnowledge: boolean, knowledge: string): string {
  const knowledgeBlock = useKnowledge && knowledge
    ? `\n\n---\n## KNOWLEDGE PRODUK CREAVOO (baca ini dulu, jadikan landasan script):\n\n${knowledge}\n\n---\n\nGunakan knowledge Creavoo di atas sebagai:\n- Sumber fakta, angka, dan use case yang akurat\n- Panduan tone dan voice (friendly, bahasa Indonesia casual, empati dulu baru solusi)\n- Konteks pain points yang relevan untuk audiens creator Indonesia\n- Referensi fitur Creavoo jika topik relevan (tapi jangan hard-sell, biarkan natural)\n\n`
    : "\n\nTopik bebas seputar dunia digital, teknologi, media sosial, atau produktivitas — tidak harus tentang Creavoo. Tetap bahasa Indonesia casual, tone friendly.\n\n";

  const layoutGuide = `Pilih layout yang paling cocok untuk topik ini:
- "center" → tips umum, motivasi, insight
- "side" → tutorial, langkah-langkah, hidden gems
- "bold" → mistakes, perbandingan, sesuatu yang mengejutkan

Pilih format narasi yang paling cocok:
- 5 tips praktis → tips actionable
- explained → jelasin konsep dari nol
- mistakes → kesalahan umum + solusi
- beginner-vs-pro → kontras cara berpikir
- hidden gems → hal tersembunyi yang jarang diketahui
- tutorial → langkah berurutan

Pilih berdasarkan topik yang diberikan user, bukan kebiasaan. Sertakan pilihan dalam field "layout" dan "format" di JSON output.`;

  return `Kamu adalah content creator senior yang bikin script video pendek viral untuk TikTok/Instagram Reels/YouTube Shorts. Target durasi video: 1 menit sampai maksimal 1 menit 30 detik.${knowledgeBlock}${layoutGuide}

Kamu HARUS mengembalikan JSON valid (tanpa markdown, hanya JSON murni):
{
  "videoTitle": "string (maks 45 karakter, catchy, pakai angka jika relevan)",
  "subtitle": "string (maks 65 karakter, hook yang bikin penasaran dan scroll-stop)",
  "introEmoji": "string (1 emoji yang paling relevan dengan topik)",
  "accent": "string (pilih hex color yang paling cocok dengan vibe topik: #6366f1=teknologi/AI, #3b82f6=informatif/tutorial, #22c55e=produktivitas/sukses, #f97316=energi/motivasi, #ec4899=kreatif/lifestyle, #00AEEF=social media/digital, #eab308=tips/warning, #ef4444=mistakes/bahaya)",
  "layout": "string (pilih: center | side | bold — sesuai konten)",
  "tips": [
    {
      "title": "string (maks 35 karakter, nama tip/poin singkat dan kuat)",
      "subtitle": "string (maks 80 karakter, manfaat atau konteks singkat)",
      "emoji": "string (1 emoji)",
      "visual": {
        "type": "stat | checklist | bullets | quote | code | comparison (PILIH yang paling cocok — VARIASIKAN, jangan semua sama)",
        "number": "string (jika type=stat: angka besar, maks 6 karakter, e.g. '3x', '80%', '5 dtk')",
        "label": "string (jika type=stat: konteks angka, maks 40 karakter)",
        "items": ["string (jika type=checklist/bullets: maks 38 karakter)", "...", "..."],
        "text": "string (jika type=quote: insight kuat, maks 90 karakter)",
        "source": "string (jika type=quote: opsional, e.g. 'Creator 100K followers')",
        "lines": ["string (jika type=code: baris kode pendek, maks 40 karakter)", "...", "...", "..."],
        "left": "string (jika type=comparison: versi salah/pemula, maks 50 karakter)",
        "right": "string (jika type=comparison: versi benar/pro, maks 50 karakter)",
        "leftLabel": "string (jika type=comparison: label kiri, e.g. '❌ Pemula')",
        "rightLabel": "string (jika type=comparison: label kanan, e.g. '✅ Pro')"
      }
    }
  ],
  "ctaText": "string (maks 50 karakter, ajakan follow @creavoo.id yang natural)",
  "scenes": [
    { "id": "intro", "text": "string (narasi voiceover intro, TEPAT 2-3 kalimat pendek, hook pain point yang langsung to-the-point, bahasa Indonesia casual/gaul)" },
    { "id": "tip-1", "text": "string (TEPAT 2-3 kalimat, langsung ke intinya, spesifik dan actionable)" },
    { "id": "tip-2", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-3", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-4", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-5", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "outro", "text": "string (TEPAT 2 kalimat, CTA natural yang sebut @creavoo.id dan creavoo.com)" }
  ]
}

Aturan PENTING:
- Bahasa Indonesia casual/gaul tapi tetap mudah dipahami
- SETIAP scene MAKSIMAL 3 kalimat pendek — ini untuk video 1 menit, bukan 2 menit
- Kalimat harus pendek dan bertenaga — buang kata yang tidak perlu
- Hindari simbol: # & / → tulis sebagai kata. Tanda @ boleh hanya untuk @creavoo.id di outro
- Angka HARUS ditulis sebagai kata: "lima" bukan "5", "dua puluh" bukan "20" — KECUALI di field visual (number, items, dll)
- Akronim (AI, TikTok, Instagram, API, URL) boleh dipakai as-is
- tips array: TEPAT 5 item
- Visual type WAJIB BERVARIASI — dari 5 tips, gunakan minimal 3 type berbeda. Jangan semua "bullets"
  * stat → kalau ada angka/metrik impresif yang bisa dikutip
  * checklist → langkah yang harus dilakukan berurutan
  * comparison → cara salah vs benar / pemula vs pro — paling engaging
  * quote → insight atau prinsip kuat yang bikin orang pause
  * code → tip teknis dengan contoh konkret (command, formula, syntax)
  * bullets → kalau tidak ada yang lebih cocok
- Pilih visual type berdasarkan ISI tip, bukan kebiasaan. Comparison dan stat paling viral
- items/lines: TEPAT 3 item (maks 38 karakter masing-masing)
- outro WAJIB sebut "@creavoo.id" dan "creavoo.com" secara natural
- scenes array: TEPAT 7 item dengan id persis: intro, tip-1, tip-2, tip-3, tip-4, tip-5, outro`;
}

const MEMORY_BLOB_KEY = "memory/history.json";
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

async function readMemory(): Promise<string[]> {
  try {
    const meta = await head(MEMORY_BLOB_KEY, { token: BLOB_TOKEN });
    const res = await fetch(meta.url);
    return await res.json();
  } catch {
    return [];
  }
}

async function appendMemory(title: string): Promise<void> {
  try {
    const existing = await readMemory();
    const updated = [title, ...existing].slice(0, 100); // simpan max 100
    await put(MEMORY_BLOB_KEY, JSON.stringify(updated), {
      access: "public", token: BLOB_TOKEN, addRandomSuffix: false,
    });
  } catch { /* non-blocking */ }
}

function buildMemoryBlock(titles: string[]): string {
  if (!titles.length) return "";
  return `\n\n---\n## MEMORY — Video yang sudah pernah dibuat (JANGAN duplikasi topik/angle ini):\n${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nAturan memory:\n- Jangan buat video dengan topik, angle, atau hook yang mirip dengan list di atas\n- Kalau topik yang diminta user sama, cari sudut pandang yang BENAR-BENAR berbeda\n- Variasikan format narasi, bukan cuma ganti judul\n---\n`;
}

export async function POST(req: NextRequest) {
  const { topic, useKnowledge = true } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  // Memory selalu dibaca regardless useKnowledge
  const knowledge = useKnowledge ? loadCreavooKnowledge() : "";
  const previousTitles = await readMemory();
  const memoryBlock = buildMemoryBlock(previousTitles);

  // Ambil analytics hint (best performing content) — non-blocking, ignore error
  let analyticsHint = "";
  try {
    const zernioKey = process.env.ZERNIO_API_KEY;
    if (zernioKey) {
      const r = await fetch("https://zernio.com/api/v1/analytics/daily-metrics?fromDate=" +
        new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0] +
        "&toDate=" + new Date().toISOString().split("T")[0],
        { headers: { Authorization: `Bearer ${zernioKey}` }, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        const metrics = Array.isArray(d) ? d : (d?.data ?? []);
        if (metrics.length) {
          const top = [...metrics].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 3);
          const topDates = top.map((m: { date?: string; views?: number }) => `${m.date}: ${m.views} views`).join(", ");
          analyticsHint = `\n\n## ANALYTICS HINT — Performa konten 30 hari terakhir:\nHari dengan views tertinggi: ${topDates}\nGunakan ini untuk pilih topik/angle yang sedang relevan dengan audiens.\n`;
        }
      }
    }
  } catch { /* non-blocking */ }

  let data = null;
  let lastRaw = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "creavoo-combo",
      messages: [
        { role: "system", content: buildSystemPrompt(useKnowledge, knowledge + memoryBlock + analyticsHint) },
        {
          role: "user",
          content: `Buat script video dengan topik: "${topic}"\n\nPENTING:\n- Kembalikan JSON lengkap, jangan dipotong\n- Tiap scene MAKSIMAL 3 kalimat pendek — target total video 1 menit sampai 1 menit 30 detik\n- Outro WAJIB sebut @creavoo.id dan creavoo.com\n- Visual type HARUS bervariasi, minimal 3 type berbeda dari 5 tips\n- JANGAN duplikasi topik/angle dari memory di atas\n- Pilih layout dan accent color yang paling cocok untuk topik ini${useKnowledge ? "\n- Gunakan knowledge Creavoo sebagai landasan fakta dan tone" : "\n- Topik bebas digital, JANGAN hard-sell Creavoo"}`,
        },
      ],
      temperature: 0.85,
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

  // layout dari AI, fallback center
  if (!["center", "side", "bold"].includes(data.layout)) data.layout = "center";
  data.knowledgeUsed = useKnowledge;

  // Simpan judul ke Blob memory (non-blocking)
  appendMemory(data.videoTitle);

  return NextResponse.json(data);
}
