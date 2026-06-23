# Creavoo Video Factory

> **Handoff doc** — baca ini sebelum lanjut ngoding. Menjelaskan apa projectnya, arsitektur, dan state terakhir.

---

## Apa ini?

Web app untuk generate **short-form video vertikal (1080×1920, 30fps)** secara otomatis dari satu topik teks.

User ketik topik → AI tulis script → GitHub Actions render video pakai Remotion + ElevenLabs → video MP4 tersimpan di Vercel Blob → bisa didownload/diposting ke TikTok/Reels/Shorts.

**Owner:** Creavoo (`creavoo.com`) — platform AI social media growth untuk creator Indonesia.

**Repo:** `ezazee/Creavoo-Video-Factory` (GitHub, branch `main`)

---

## Stack

| Layer | Tech |
|---|---|
| Web UI | Next.js 15 App Router, Tailwind CSS, `"use client"` |
| AI Script | Creavoo AI API (OpenAI-compatible endpoint) |
| TTS | ElevenLabs (primary) + edge-tts Python (free fallback) |
| Render | GitHub Actions (Ubuntu, Node 20) — gratis ~285 render/bulan |
| Video Engine | Remotion 4.x (`npx remotion render`) |
| Storage | Vercel Blob (public MP4) |
| Analytics | Zernio API (TikTok + Instagram) |
| Deploy | Vercel (web app) |

---

## Alur Lengkap

```
User → ketik topik + pilih template + pilih voice
  ↓
/api/trends   — baca creavoo-knowledge.md → scrape Google Trends ID → AI suggest 6 topik
  ↓
/api/generate — baca creavoo-knowledge.md → AI generate JSON script (7 scenes, 5 tips, visual per tip)
  ↓
/api/render   — trigger GitHub Actions workflow_dispatch
  ↓
GitHub Actions:
  1. checkout repo
  2. install deps (npm ci + pip install edge-tts requests)
  3. generate MP3 voiceover per scene (ElevenLabs atau edge-tts)
  4. npx remotion render GeneratedVideo out/video.mp4
  5. upload ke Vercel Blob → video-{runId}.mp4
  ↓
/api/status   — poll setiap 15 detik, cek run status + video URL di Blob
  ↓
Done → tampil video player + download button
```

---

## Struktur File Penting

```
remotion-shorts-template/
├── PROJECT.md                        ← file ini
├── web/                              ← Next.js app (deploy ke Vercel)
│   ├── app/
│   │   ├── page.tsx                  ← halaman utama generate
│   │   ├── results/page.tsx          ← list semua video history
│   │   ├── analytics/page.tsx        ← dashboard analytics Zernio
│   │   └── api/
│   │       ├── generate/route.ts     ← AI script generation
│   │       ├── render/route.ts       ← trigger GitHub Actions
│   │       ├── status/route.ts       ← poll render status + blob URL
│   │       ├── actions/route.ts      ← GET job steps / DELETE run
│   │       ├── blob/route.ts         ← DELETE video dari Vercel Blob
│   │       ├── voices/route.ts       ← list ElevenLabs voices
│   │       ├── voice-preview/route.ts← preview suara ElevenLabs
│   │       ├── trends/route.ts       ← Google Trends + AI topic suggest
│   │       └── analytics/route.ts   ← proxy ke Zernio API
│   └── knowledge/
│       └── creavoo-knowledge.md      ← knowledge base produk Creavoo (PENTING)
│
├── src/videos/generated/             ← Remotion composition
│   ├── Composition.tsx               ← main composition, terima props dari render
│   ├── voiceover.ts                  ← scene IDs + audio paths
│   └── scenes/
│       ├── Intro.tsx
│       ├── Outro.tsx
│       ├── TipScene.tsx              ← layout: center
│       ├── TipSceneSide.tsx          ← layout: side
│       ├── TipSceneBold.tsx          ← layout: bold
│       └── VisualBlock.tsx           ← dynamic visual per tip (stat/checklist/quote/code/comparison/bullets)
│
├── scripts/
│   ├── upload-blob.mjs               ← upload hasil render ke Vercel Blob
│   └── generate-voiceover.ts         ← generate MP3 lokal (dev only)
│
├── .github/workflows/
│   └── render-video.yml              ← GitHub Actions render pipeline
│
└── src/Root.tsx                      ← register Remotion composition
```

---

## Env Variables

### `web/.env.local` (Vercel env vars)
```
AI_BASE_URL=https://creavoo-9router.fly.dev/v1
AI_API_KEY=sk-ed9692f760e5767c-iyjffp-fb655a19
AI_MODEL=creavoo-combo
GITHUB_REPO=ezazee/Creavoo-Video-Factory
GITHUB_TOKEN=github_pat_11ATAKROQ0Qc9xjYiEF5xH_...
NEXT_PUBLIC_GITHUB_REPO=ezazee/Creavoo-Video-Factory
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_Kpz71y545mFjWaLo_...
TTS_VOICE=id-ID-ArdiNeural
ZERNIO_API_KEY=sk_085beacb098ab8ec0ddf6a2852f0e53b...
ELEVENLABS_API_KEY=sk_b4f2262818f882a5825ed99bfde75a07...
```

### GitHub Repository Secrets (Settings → Secrets → Actions)
```
BLOB_READ_WRITE_TOKEN   ← wajib ada, untuk upload MP4 setelah render
ELEVENLABS_API_KEY      ← untuk TTS ElevenLabs di GitHub Actions
```

> **Catatan:** Secret harus di **Repository secrets**, BUKAN Environment secrets.

---

## AI Script: Format JSON yang Di-generate

```json
{
  "videoTitle": "string (maks 45 karakter)",
  "subtitle": "string (maks 65 karakter)",
  "introEmoji": "string (1 emoji)",
  "accent": "#hexcolor",
  "tips": [
    {
      "title": "string (maks 35 karakter)",
      "subtitle": "string (maks 80 karakter)",
      "emoji": "string",
      "visual": {
        "type": "stat | checklist | bullets | quote | code | comparison",
        // stat:       number (e.g. "3x"), label
        // checklist:  items[3]
        // bullets:    items[3]
        // quote:      text, source?
        // code:       lines[3-4]
        // comparison: left, right, leftLabel?, rightLabel?
      }
    }
  ],
  "ctaText": "string",
  "scenes": [
    { "id": "intro",  "text": "narasi 4-6 kalimat" },
    { "id": "tip-1",  "text": "narasi 4-6 kalimat" },
    { "id": "tip-2",  "text": "narasi 4-6 kalimat" },
    { "id": "tip-3",  "text": "narasi 4-6 kalimat" },
    { "id": "tip-4",  "text": "narasi 4-6 kalimat" },
    { "id": "tip-5",  "text": "narasi 4-6 kalimat" },
    { "id": "outro",  "text": "narasi 3-4 kalimat" }
  ]
}
```

---

## Video Templates (6 jenis)

| Slug | Layout | Panduan |
|---|---|---|
| `5-tips` | center | intro + 5 tips praktis + outro |
| `explained` | bold | penjelasan konsep dari nol |
| `mistakes` | bold | 5 kesalahan umum + solusinya |
| `beginner-vs-pro` | side | kontras cara pemula vs pro |
| `hidden-gems` | side | 5 hal jarang diketahui |
| `tutorial` | side | 5 langkah berurutan |

---

## Visual Blocks per Tip

Setiap tip punya `visual` yang dipilih AI berdasarkan konten. Muncul animasi di **35% durasi scene**, subtitle fade out saat visual datang:

| Type | Tampilan | Cocok untuk |
|---|---|---|
| `stat` | Angka besar (200px) + label, glow pulse | Tips dengan metrik/angka |
| `checklist` | 3 item + animated checkmark | Langkah-langkah actionable |
| `bullets` | 3 poin dengan accent dot | Tips generic |
| `quote` | Card dengan tanda kutip besar | Insight/prinsip kuat |
| `code` | Mock terminal + syntax color | Tips teknis/kode |
| `comparison` | Split card merah (❌) vs warna (✅) | Pemula vs pro / salah vs benar |

---

## Halaman Web

| URL | Fungsi |
|---|---|
| `/` | Generate video — pilih template, topik, voice, render |
| `/results` | List semua history video, preview, download, delete |
| `/analytics` | Dashboard TikTok + Instagram via Zernio API |

### Fitur di halaman `/` (Generate):
- 6 template cards dengan preview CSS 9:16 mini
- Trending Topics button → fetch Google Trends ID → AI suggest 6 topik sesuai domain Creavoo
- ElevenLabs voices dinamis (loaded dari API) + edge-tts fallback
- Play preview voice sebelum pilih
- Render state: script preview (kiri) + inline GitHub Actions steps (kanan) auto-refresh 15s
- Cancel run button
- Done state: video player + download + "Buat video baru"

### Fitur di `/results`:
- List panel (kiri): semua history dengan status indicator
- Preview panel (kanan): video player ketika item dipilih
- Delete video → hapus dari Vercel Blob permanen
- Delete action → cancel + hapus GitHub Actions run

---

## Knowledge Base

`web/knowledge/creavoo-knowledge.md` — knowledge tentang produk Creavoo (~500 baris).

Dibaca oleh dua route sebelum operasi:
- `/api/trends` — baca knowledge → scrape Google Trends → AI suggest topik yang relevan dengan domain Creavoo
- `/api/generate` — baca knowledge → inject ke system prompt → AI pakai sebagai landasan fakta, tone, pain points

**Update file ini** kalau ada info produk baru. Tidak perlu deploy ulang — dibaca langsung dari filesystem saat runtime.

---

## State Terakhir (per 23 Juni 2026)

### Sudah jalan ✅
- Full pipeline: topik → script → render → upload → download
- ElevenLabs TTS + edge-tts fallback (auto-detect dari voice ID pattern)
- 6 template dengan 3 layout Remotion berbeda
- Dynamic visual blocks per tip (6 tipe, AI yang pilih)
- Knowledge-first flow (creavoo-knowledge.md)
- Inline GitHub Actions logs (poll tiap 15s)
- Results page dengan delete video + delete action
- Analytics page (Zernio — TikTok + Instagram)
- Voices API (ElevenLabs dynamic) + preview suara

### Yang belum / potensial next step
- [ ] Watermark `@yourhandle` masih hardcoded — perlu bisa diubah dari UI atau env
- [ ] Intro dan Outro scene belum punya visual blocks (masih static)
- [ ] Tidak ada progress bar render yang real (hanya step names dari GitHub API)
- [ ] Analytics Zernio belum confirmed working (perlu test dengan akun yang terhubung)
- [ ] Belum ada auth/login — siapapun yang punya URL bisa akses
- [ ] Video history tersimpan di localStorage saja — hilang kalau clear browser
- [ ] `@yourhandle` watermark di video perlu bisa di-set per user

---

## Commands

```bash
# Dev (web)
cd web && npm run dev

# Dev (Remotion preview)  
npm run dev

# Generate voiceover lokal
npm run generate-voiceover -- --video generated

# Render lokal
npx remotion render GeneratedVideo out/video.mp4

# Lint
cd web && npm run lint
```

---

*Last updated: 23 Juni 2026*
