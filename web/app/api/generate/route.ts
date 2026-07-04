import { NextRequest } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { put } from "@/lib/storage";
import { readMemory, isDuplicateTitle } from "../../../lib/memory";
import { loadConfig, getZernioKey } from "../../../lib/config";

// AI generation bisa 1-3 menit (retry sampai 3x) — jangan dibunuh di 60s default
export const maxDuration = 300;

function loadCreavooKnowledge(): string {
  try {
    const filePath = path.join(process.cwd(), "knowledge", "creavoo-knowledge.md");
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

const LAYOUT_GUIDE = `Pilih layout yang paling cocok untuk topik ini:
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

const VISUAL_SCHEMA = `        "visual": {
        "type": "stat | checklist | bullets | quote | code | comparison (PILIH yang paling cocok — VARIASIKAN, jangan semua sama)",
        "number": "string (jika type=stat: angka besar, maks 6 karakter, e.g. '3x', '80%', '5 dtk')",
        "label": "string (jika type=stat: konteks angka, maks 40 karakter)",
        "items": ["string (jika type=checklist/bullets: maks 38 karakter)", "...", "..."],
        "text": "string (jika type=quote: insight kuat, maks 90 karakter)",
        "source": "string (jika type=quote: opsional)",
        "lines": ["string (jika type=code: baris kode pendek, maks 40 karakter)", "...", "...", "..."],
        "left": "string (jika type=comparison: versi salah/pemula, maks 50 karakter)",
        "right": "string (jika type=comparison: versi benar/pro, maks 50 karakter)",
        "leftLabel": "string (jika type=comparison: label kiri, e.g. '❌ Pemula')",
        "rightLabel": "string (jika type=comparison: label kanan, e.g. '✅ Pro')"
      },
      "iconSlug": "string (OPSIONAL — HANYA jika tip membahas brand/tool spesifik: slug simple-icons huruf kecil, e.g. 'github', 'figma', 'tiktok', 'instagram', 'canva', 'notion', 'openai', 'googlechrome'. Kosongkan jika tidak ada brand spesifik)",
      "toolUrl": "string (OPSIONAL — HANYA jika tip membahas tool/website spesifik: URL resmi homepage tool tersebut, e.g. 'https://canva.com'. Kosongkan jika tidak relevan)"`;

const VISUAL_RULES = `- Visual type WAJIB BERVARIASI — dari 5 tips, gunakan minimal 3 type berbeda
  * stat → metrik, waktu, angka impresif yang bisa dikutip
  * checklist → langkah berurutan yang harus dilakukan
  * comparison → cara salah vs benar / pemula vs pro — paling engaging
  * quote → insight atau prinsip kuat yang bikin orang pause
  * code → snippet pendek, command, syntax
  * bullets → kalau tidak ada yang lebih cocok
- Pilih visual type berdasarkan ISI tip, bukan kebiasaan. Comparison dan stat paling viral
- items/lines: TEPAT 3 item (maks 38 karakter masing-masing)
- iconSlug & toolUrl: isi HANYA jika tip menyebut brand/tool nyata (GitHub, Figma, Canva, TikTok, CapCut, Notion, dll) — jangan mengarang slug/URL`;

function buildSystemPrompt(
  useKnowledge: boolean,
  knowledge: string,
  profile: "creavoo" | "zaportfolio" = "creavoo"
): string {
  if (profile === "zaportfolio") {
    return `Kamu adalah developer senior yang bikin script video pendek viral untuk TikTok/Instagram Reels/YouTube Shorts. Target audiens: developer dan programmer Indonesia. Target durasi: 1 menit sampai maksimal 1 menit 30 detik.

## KONTEKS BRAND: ZAPORTFOLIO

Zaportfolio adalah akun konten untuk developer, programmer, dan IT enthusiast Indonesia.
Niche: tips coding, portfolio developer, karir IT, tools developer, productivity programming.

Audiens target:
- Developer / programmer Indonesia (junior sampai mid-level)
- Mahasiswa IT dan fresh graduate tech
- Career switcher yang mau masuk dunia IT
- Freelancer dan remote worker di bidang tech

Tone & voice Zaportfolio:
- Bahasa: campuran Indo + istilah teknis yang familiar (git, deploy, debug, stack, dll)
- Gaya: santai tapi credible, kayak teman senior yang ngasih tips jujur
- Hindari: terlalu formal, terlalu hype, terlalu "motivational speaker"
- Boleh: humor programmer (meme culture ok), jargon teknis umum

Topik yang perform untuk Zaportfolio:
- Tips portfolio yang bikin HRD tertarik
- Tools dan shortcut yang jarang diketahui junior dev
- Kesalahan coding atau karir yang umum dilakukan pemula
- Cara dapet freelance atau remote job sebagai developer Indonesia
- Review stack atau bahasa pemrograman dengan angle unik
- Tips belajar coding yang efisien
- Realita jadi developer (honest take)

CTA selalu ke @zaportfolio.

${LAYOUT_GUIDE}

Kamu HARUS mengembalikan JSON valid (tanpa markdown, hanya JSON murni):
{
  "videoTitle": "string (maks 45 karakter, catchy, pakai angka jika relevan)",
  "subtitle": "string (maks 65 karakter, hook yang bikin dev scroll stop)",
  "introEmoji": "string (1 emoji yang paling relevan — boleh emoji teknis: 💻🚀⚡🛠️📦🔧)",
  "accent": "string (pilih hex color sesuai vibe: #6366f1=AI/modern, #3b82f6=tutorial/informatif, #22c55e=produktivitas/sukses, #f97316=energi/tips, #1a3358=profesional/navy, #ef4444=mistakes/bahaya, #eab308=warning/keuangan, #a855f7=personal brand, #64748b=profesional)",
  "layout": "string (pilih: center | side | bold — sesuai konten)",
  "tips": [
    {
      "title": "string (maks 35 karakter, nama tip/poin singkat dan kuat)",
      "subtitle": "string (maks 80 karakter, manfaat atau konteks singkat — boleh pakai istilah teknis)",
      "emoji": "string (1 emoji)",
      ${VISUAL_SCHEMA}
    }
  ],
  "ctaText": "string (maks 50 karakter, ajakan follow @zaportfolio yang natural)",
  "caption": "string (caption siap-post untuk TikTok/Instagram: 2-4 kalimat hook + ringkasan nilai video, casual dev tone, ada call-to-action follow @zaportfolio. JANGAN sertakan hashtag di sini)",
  "hashtags": ["string (10-15 hashtag relevan TANPA tanda #, campuran broad + niche dev, e.g. 'developer', 'programmer', 'coding', 'belajarcoding', 'fyp')"],
  "scenes": [
    { "id": "intro", "text": "string (narasi voiceover intro, TEPAT 2-3 kalimat pendek, hook pain point developer yang langsung to-the-point, bahasa Indonesia casual + sedikit istilah teknis)" },
    { "id": "tip-1", "text": "string (TEPAT 2-3 kalimat, langsung ke intinya, spesifik dan actionable untuk developer)" },
    { "id": "tip-2", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-3", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-4", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "tip-5", "text": "string (TEPAT 2-3 kalimat)" },
    { "id": "outro", "text": "string (TEPAT 2 kalimat, CTA natural yang sebut @zaportfolio)" }
  ]
}

Aturan PENTING:
- Bahasa Indonesia casual dengan istilah teknis yang familiar untuk developer
- Tone: kayak teman senior dev yang kasih tips jujur — bukan motivasi kosong
- SETIAP scene MAKSIMAL 3 kalimat pendek — ini untuk video 1 menit, bukan 2 menit
- Hindari simbol di field scenes/tips/visual: # & / tulis sebagai kata. Tanda @ boleh hanya untuk @zaportfolio di outro
- Field "caption" boleh pakai @ dan emoji. Field "hashtags" tulis TANPA tanda #
- Angka HARUS ditulis sebagai kata di scenes: "lima" bukan "5" — KECUALI di field visual
- Akronim teknis (API, CSS, HTML, SQL, UI, UX, REST, HTTP, JSON, CLI, SDK) boleh as-is
- tips array: TEPAT 5 item
${VISUAL_RULES}
- outro WAJIB sebut "@zaportfolio" secara natural
- scenes array: TEPAT 7 item dengan id persis: intro, tip-1, tip-2, tip-3, tip-4, tip-5, outro`;
  }

  // --- CREAVOO ---
  const knowledgeBlock = useKnowledge && knowledge
    ? `\n\n---\n## KNOWLEDGE PRODUK CREAVOO (baca ini dulu, jadikan landasan script):\n\n${knowledge}\n\n---\n\nGunakan knowledge Creavoo di atas sebagai:\n- Sumber fakta, angka, dan use case yang akurat\n- Panduan tone dan voice per tipe kreator (lihat Bagian 9)\n- Arahan konten spesifik per platform (lihat Bagian 10)\n- Angle dan sudut pandang per niche (lihat Bagian 11)\n- Definisi tone konten yang diminta (lihat Bagian 12)\n- Konteks pain points yang relevan untuk audiens creator Indonesia\n- Referensi fitur Creavoo jika topik relevan (tapi jangan hard-sell, biarkan natural)\n\n`
    : `\n\n## ARAHAN KONTEN KNOWLEDGE OFF\n\nBuat konten seputar dunia digital, bisnis online, dan kreator Indonesia — TANPA harus promosi Creavoo.\n\nKategori topik yang tersedia (pilih yang paling relevan dengan topik yang diberikan):\n1. Pertumbuhan akun organik — follower, engagement, algoritma\n2. Pengelolaan bisnis di sosmed — UMKM, branding, jualan online\n3. Rahasia algoritma platform — FYP TikTok, Explore IG, Shorts YouTube\n4. Monetisasi konten — affiliate, endorse, jualan digital, passive income\n5. Psikologi konten viral — hook, scroll stopper, emotional trigger, caption\n6. Produktivitas kreator — batch content, tools gratis, workflow efisien\n7. Personal branding — otoritas niche, konsistensi, dapat klien\n8. Tips teknis kreator — rekam HP, lighting, audio, edit video gratis\n\nTetap bahasa Indonesia casual, tone friendly, dan berikan value yang actionable.\nCTA boleh arahkan ke @creavoo.id sebagai tools yang membantu, tapi bukan hard-sell.\n\n`;

  return `Kamu adalah content creator senior yang bikin script video pendek viral untuk TikTok/Instagram Reels/YouTube Shorts. Target durasi video: 1 menit sampai maksimal 1 menit 30 detik.${knowledgeBlock}${LAYOUT_GUIDE}

Kamu HARUS mengembalikan JSON valid (tanpa markdown, hanya JSON murni):
{
  "videoTitle": "string (maks 45 karakter, catchy, pakai angka jika relevan)",
  "subtitle": "string (maks 65 karakter, hook yang bikin penasaran dan scroll-stop)",
  "introEmoji": "string (1 emoji yang paling relevan dengan topik)",
  "accent": "string (pilih hex color yang paling cocok dengan vibe topik: #6366f1=teknologi/AI, #3b82f6=informatif/tutorial, #22c55e=produktivitas/sukses/bisnis, #f97316=energi/motivasi/UMKM, #ec4899=kreatif/lifestyle/beauty/fashion, #00AEEF=social media/digital/Creavoo, #eab308=tips/warning/keuangan, #ef4444=mistakes/bahaya, #a855f7=personal brand/KOL, #14b8a6=wellness/kesehatan, #f59e0b=entertainment/gaming, #64748b=profesional/LinkedIn)",
  "layout": "string (pilih: center | side | bold — sesuai konten)",
  "tips": [
    {
      "title": "string (maks 35 karakter, nama tip/poin singkat dan kuat)",
      "subtitle": "string (maks 80 karakter, manfaat atau konteks singkat)",
      "emoji": "string (1 emoji)",
      ${VISUAL_SCHEMA}
    }
  ],
  "ctaText": "string (maks 50 karakter, ajakan follow @creavoo.id yang natural)",
  "caption": "string (caption siap-post untuk TikTok/Instagram: 2-4 kalimat hook + ringkasan nilai video, casual, ada call-to-action follow @creavoo.id. JANGAN sertakan hashtag di sini)",
  "hashtags": ["string (10-15 hashtag relevan TANPA tanda #, campuran broad + niche, e.g. 'fyp', 'tipskonten', 'socialmediatips')"],
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
- Hindari simbol di field scenes/tips/visual: # & / → tulis sebagai kata. Tanda @ boleh hanya untuk @creavoo.id di outro
- Field "caption" boleh pakai @ dan emoji. Field "hashtags" tulis TANPA tanda # (cukup kata, e.g. "fyp" bukan "#fyp")
- Angka HARUS ditulis sebagai kata: "lima" bukan "5", "dua puluh" bukan "20" — KECUALI di field visual (number, items, dll)
- Akronim (AI, TikTok, Instagram, API, URL) boleh dipakai as-is
- tips array: TEPAT 5 item
${VISUAL_RULES}
- outro WAJIB sebut "@creavoo.id" dan "creavoo.com" secara natural
- scenes array: TEPAT 7 item dengan id persis: intro, tip-1, tip-2, tip-3, tip-4, tip-5, outro`;
}

const MEMORY_BLOB_KEY = "memory/history.json";

async function appendMemory(entry: string): Promise<void> {
  try {
    const existing = await readMemory();
    const updated = [entry, ...existing].slice(0, 100);
    await put(MEMORY_BLOB_KEY, JSON.stringify(updated));
  } catch { /* non-blocking */ }
}

function buildMemoryBlock(entries: string[]): string {
  if (!entries.length) return "";
  return `\n\n---\n## MEMORY — Konten yang SUDAH PERNAH dibuat (DILARANG KERAS duplikasi):\n${entries.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nAturan memory (WAJIB):\n- DILARANG membuat judul yang sama atau mirip dengan list di atas\n- DILARANG mengulang tips/poin yang sudah pernah dipakai (lihat bagian "tips:" tiap entry)\n- Topik yang sama = WAJIB cari sudut pandang, angle, hook, dan tips yang BENAR-BENAR berbeda\n- Kalau tidak bisa bikin angle baru yang berbeda, pilih sub-topik yang lebih spesifik\n---\n`;
}


export async function POST(req: NextRequest) {
  const { topic, useKnowledge = true, profile = "creavoo", stream: wantStream = true } = await req.json();
  const currentYear = new Date().getFullYear();
  if (!topic) return new Response(JSON.stringify({ error: "topic required" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const isZap = profile === "zaportfolio";
  const knowledge = (!isZap && useKnowledge) ? loadCreavooKnowledge() : "";

  const config = loadConfig();
  const client = new OpenAI({ baseURL: config.aiBaseUrl, apiKey: config.aiApiKey });

  // Gunakan analytics key sesuai profile
  const zernioKey = getZernioKey(profile);

  // Jalankan memory + analytics secara paralel
  const [previousTitles, analyticsHint] = await Promise.all([
    readMemory(),
    (async () => {
      try {
        if (!zernioKey) return "";
        const r = await fetch("https://zernio.com/api/v1/analytics/daily-metrics?fromDate=" +
          new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0] +
          "&toDate=" + new Date().toISOString().split("T")[0],
          { headers: { Authorization: `Bearer ${zernioKey}` }, signal: AbortSignal.timeout(3000) }
        );
        if (!r.ok) return "";
        const d = await r.json();
        const metrics = Array.isArray(d) ? d : (d?.data ?? []);
        if (!metrics.length) return "";
        const top = [...metrics].sort((a: { views?: number }, b: { views?: number }) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 3);
        const topDates = top.map((m: { date?: string; views?: number }) => `${m.date}: ${m.views} views`).join(", ");
        return `\n\n## ANALYTICS HINT — Performa konten 30 hari terakhir:\nHari dengan views tertinggi: ${topDates}\nGunakan ini untuk pilih topik/angle yang sedang relevan dengan audiens.\n`;
      } catch { return ""; }
    })(),
  ]);

  const memoryBlock = buildMemoryBlock(previousTitles);

  const systemPrompt = `Tahun sekarang adalah ${currentYear}. Jika menyebut tahun dalam konten, gunakan ${currentYear} — jangan pernah sebut tahun yang sudah lewat.\n\n` + buildSystemPrompt(useKnowledge, knowledge + memoryBlock + analyticsHint, isZap ? "zaportfolio" : "creavoo");
  const userPrompt = isZap
    ? `Tahun sekarang ${currentYear}. Buat script video dengan topik: "${topic}"\n\nPENTING:\n- Kembalikan JSON lengkap, jangan dipotong\n- Tiap scene MAKSIMAL 3 kalimat pendek — target total video 1 menit sampai 1 menit 30 detik\n- Outro WAJIB sebut @zaportfolio\n- Visual type HARUS bervariasi, minimal 3 type berbeda dari 5 tips — prioritaskan "code" dan "comparison" untuk konten developer\n- JANGAN duplikasi topik/angle dari memory di atas\n- Pilih layout dan accent color yang cocok untuk konten developer Indonesia`
    : `Tahun sekarang ${currentYear}. Buat script video dengan topik: "${topic}"\n\nPENTING:\n- Kembalikan JSON lengkap, jangan dipotong\n- Tiap scene MAKSIMAL 3 kalimat pendek — target total video 1 menit sampai 1 menit 30 detik\n- Outro WAJIB sebut @creavoo.id dan creavoo.com\n- Visual type HARUS bervariasi, minimal 3 type berbeda dari 5 tips\n- JANGAN duplikasi topik/angle dari memory di atas\n- Pilih layout dan accent color yang paling cocok untuk topik ini${useKnowledge ? "\n- Gunakan knowledge Creavoo sebagai landasan fakta dan tone" : "\n- Topik bebas digital, JANGAN hard-sell Creavoo"}`;

  // Inti generation — dipakai dua mode: SSE stream (browser) dan JSON biasa
  // (panggilan internal scheduler /api/schedule/tick, n8n, dsb).
  async function runGeneration(onProgress: (len: number) => void): Promise<Record<string, unknown>> {
    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let data: Record<string, unknown> | null = null;
    let duplicateRejected = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      const aiStream = await client.chat.completions.create({
        model: config.aiModel,
        messages,
        temperature: attempt === 0 ? 0.85 : 0.95,
        max_tokens: 3500,
        stream: true,
      });

      let accumulated = "";
      for await (const chunk of aiStream) {
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) {
          accumulated += token;
          onProgress(accumulated.length);
        }
      }

      // Parse hasil
      let jsonStr = accumulated.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      let retryHint = "JSON tidak lengkap atau tidak valid. Ulangi dari awal, kembalikan JSON lengkap dan valid saja.";
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.videoTitle && Array.isArray(parsed.tips) && parsed.tips.length === 5 && Array.isArray(parsed.scenes) && parsed.scenes.length === 7) {
          // Tolak hasil yang judulnya duplikat dengan konten sebelumnya
          if (isDuplicateTitle(parsed.videoTitle, previousTitles)) {
            duplicateRejected = true;
            retryHint = `Judul "${parsed.videoTitle}" DUPLIKAT dengan konten yang sudah pernah dibuat (lihat MEMORY). Ulangi dari awal dengan judul, angle, hook, dan tips yang BENAR-BENAR BERBEDA. Kembalikan JSON lengkap saja.`;
          } else {
            data = parsed;
            break;
          }
        }
      } catch { /* retry */ }

      if (attempt < 2) {
        onProgress(0); // reset counter visual
        messages.push(
          { role: "user", content: accumulated },
          { role: "user", content: retryHint }
        );
      }
    }

    if (!data) {
      throw new Error(duplicateRejected
        ? "Konten dengan topik/judul ini sudah pernah dibuat. Ganti topik atau angle yang lebih spesifik, atau reset memory AI."
        : "AI returned invalid JSON setelah 3 percobaan");
    }

    if (!["center", "side", "bold"].includes(data.layout as string)) data.layout = "center";
    if (typeof data.caption !== "string" || !(data.caption as string).trim()) {
      data.caption = isZap
        ? `${data.videoTitle}\n\n${data.subtitle ?? ""}\n\nFollow @zaportfolio buat tips dev lainnya!`
        : `${data.videoTitle}\n\n${data.subtitle ?? ""}\n\nFollow @creavoo.id buat tips lainnya!`;
    }
    if (!Array.isArray(data.hashtags) || (data.hashtags as string[]).length === 0) {
      data.hashtags = isZap
        ? ["fyp", "developer", "programmer", "coding", "belajarcoding", "tipscoding", "softwaredeveloper"]
        : ["fyp", "creavoo", "tipskonten", "socialmedia", "contentcreator"];
    }
    data.hashtags = (data.hashtags as string[]).map((h) => h.replace(/^#/, "")).slice(0, 15);
    data.knowledgeUsed = !isZap && useKnowledge;

    // Paksa handle sesuai profile — AI kadang nulis handle profile lain
    if (isZap) {
      if (typeof data.ctaText === "string") data.ctaText = (data.ctaText as string).replace(/@creavoo\.id/gi, "@zaportfolio");
      if (!(data.ctaText as string)?.includes("@zaportfolio")) data.ctaText = "Follow @zaportfolio untuk tips dev lainnya!";
    } else {
      if (typeof data.ctaText === "string") data.ctaText = (data.ctaText as string).replace(/@zaportfolio/gi, "@creavoo.id");
      if (!(data.ctaText as string)?.includes("@creavoo.id")) data.ctaText = "Follow @creavoo.id untuk tips lainnya!";
    }

    // Bersihkan duplikasi label di visual comparison — AI suka mengulang "❌ Pemula:" di teks
    for (const tip of data.tips as { visual?: { type?: string; left?: string; right?: string; leftLabel?: string; rightLabel?: string } }[]) {
      const v = tip.visual;
      if (v?.type !== "comparison") continue;
      const strip = (text?: string, label?: string) => {
        if (!text) return text;
        let t = text.replace(/^[✀-➿☀-⛿⬀-⯿️❌✅⚠️]+\s*/u, "");
        const labelWord = (label ?? "").replace(/^[^\p{L}]+/u, "").trim();
        if (labelWord && t.toLowerCase().startsWith(labelWord.toLowerCase())) {
          t = t.slice(labelWord.length).replace(/^\s*[:—-]\s*/, "");
        }
        return t.trim() || text;
      };
      v.left = strip(v.left, v.leftLabel);
      v.right = strip(v.right, v.rightLabel);
    }

    const tipTitles = (data.tips as { title: string }[]).map((t) => t.title).join(", ");
    appendMemory(`[${profile}] ${topic} → ${data.videoTitle} | tips: ${tipTitles}`).catch(() => {});

    return data;
  }

  // ── Mode JSON biasa (scheduler internal / n8n / API eksternal) ──────────────
  if (wantStream === false) {
    try {
      const data = await runGeneration(() => {});
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  // ── Mode SSE stream (browser UI) ─────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      try {
        const data = await runGeneration((len) => sendEvent({ type: "token", len }));
        sendEvent({ type: "done", data });
      } catch (err) {
        sendEvent({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
