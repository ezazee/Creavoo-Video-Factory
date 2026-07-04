# Creavoo Video Factory

> **Handoff doc** — baca ini sebelum lanjut ngoding. Menjelaskan apa projectnya, arsitektur, dan state terakhir.

---

## Apa ini?

Web app untuk generate **short-form video vertikal (1080×1920, 30fps)** secara otomatis dari satu topik teks.

User ketik topik → AI tulis script → GitHub Actions render video pakai Remotion + edge-tts → video MP4 tersimpan di MinIO → bisa didownload / diposting ke TikTok & Instagram Reels.

**Owner:** Creavoo (`creavoo.com`) — platform AI social media growth untuk creator Indonesia.

**Repo:** `ezazee/Creavoo-Video-Factory` (GitHub, branch `main`)

---

## Stack

| Layer | Tech |
|---|---|
| Web UI | Next.js 15 App Router, Tailwind CSS, `"use client"` |
| AI Script | Creavoo AI API (OpenAI-compatible, model `creavoo-combo`) |
| TTS | edge-tts Python (gratis, konsisten — ElevenLabs dihapus) |
| Render | GitHub Actions (Ubuntu, Node 20) — gratis ~285 render/bulan |
| Video Engine | Remotion 4.x (`npx remotion render`) |
| Storage | MinIO (MP4 + thumbnail JPG + settings + memory) |
| Social Publish | Zernio API (TikTok + Instagram) |
| Analytics | Zernio API |
| Deploy | Vercel (web app) |

---

## Alur Lengkap

```
User → ketik topik → pilih voice + toggle knowledge/auto-upload/share-to-feed
  ↓
/api/trends   — baca creavoo-knowledge.md → AI suggest 6 topik trending
  ↓
/api/generate — baca knowledge (opsional) + baca memory Blob → AI generate JSON script
               → simpan "topik → judul" ke Blob memory (memory/history.json)
  ↓
/api/render   — trigger GitHub Actions workflow_dispatch
  ↓
GitHub Actions:
  1. checkout repo
  2. npm ci + pip install edge-tts
  3. generate MP3 voiceover per scene (edge-tts, selalu id-ID-ArdiNeural atau GadisNeural)
  4. npx remotion render GeneratedVideo out/video.mp4
  5. ffmpeg extract frame detik ke-1 → out/thumbnail.jpg
  6. upload video ke Blob → video-{runId}.mp4
  7. upload thumbnail ke Blob → thumbnail-{runId}.jpg
  ↓
/api/status   — poll setiap 15 detik, return videoUrl + thumbnailUrl
  ↓
Done → video player + download + upload TikTok/Instagram + caption & hashtag
```

---

## Struktur File Penting

```
Creavoo-Video-Factory/
├── PROJECT.md                        ← file ini
├── web/                              ← Next.js app (deploy ke Vercel)
│   ├── app/
│   │   ├── page.tsx                  ← halaman utama generate
│   │   ├── results/page.tsx          ← list semua video history
│   │   ├── analytics/page.tsx        ← dashboard analytics Zernio
│   │   └── api/
│   │       ├── generate/route.ts     ← AI script generation + memory
│   │       ├── render/route.ts       ← trigger GitHub Actions
│   │       ├── status/route.ts       ← poll render status, return videoUrl + thumbnailUrl
│   │       ├── actions/route.ts      ← GET job steps + frame progress / DELETE run
│   │       ├── blob/route.ts         ← GET list videos / DELETE video dari Blob
│   │       ├── watermark/route.ts    ← GET/POST settings/watermark.json di Blob
│   │       ├── memory/route.ts       ← DELETE memory/history.json (reset AI memory)
│   │       ├── publish/route.ts      ← POST ke Zernio (TikTok + Instagram Reels)
│   │       ├── upload-logo/route.ts  ← upload logo watermark ke Blob
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
│       ├── TipScene.tsx              ← layout: center (2-zone absolute)
│       ├── TipSceneSide.tsx          ← layout: side (2-zone absolute)
│       ├── TipSceneBold.tsx          ← layout: bold (2-zone absolute)
│       └── VisualBlock.tsx           ← dynamic visual per tip
│
├── scripts/
│   ├── upload-blob.mjs               ← upload video + thumbnail ke MinIO
│   └── generate-voiceover.ts         ← generate MP3 lokal (dev only)
│
├── .github/workflows/
│   └── render-video.yml              ← GitHub Actions render pipeline (edge-tts only)
│
└── src/Root.tsx                      ← register Remotion composition
```

---

## Env Variables

### `web/.env.local` (Vercel env vars)
```
AI_BASE_URL=https://creavoo-9router.fly.dev/v1
AI_API_KEY=sk-...
AI_MODEL=creavoo-combo
GITHUB_REPO=ezazee/Creavoo-Video-Factory
GITHUB_TOKEN=github_pat_...
NEXT_PUBLIC_GITHUB_REPO=ezazee/Creavoo-Video-Factory
MINIO_ENDPOINT=https://minio-api.namadomain.com
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=...
MINIO_REGION=us-east-1
MINIO_PUBLIC_URL=https://minio-api.namadomain.com
ZERNIO_API_KEY=sk_...
```

### GitHub Repository Secrets (Settings → Secrets → Actions)
```
MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MINIO_REGION, MINIO_PUBLIC_URL
  ← wajib ada, untuk upload MP4/thumbnail/gambar setelah render
```

> ElevenLabs dihapus sepenuhnya. Tidak ada `ELEVENLABS_API_KEY` di mana pun.

---

## AI Script: Format JSON yang Di-generate

```json
{
  "videoTitle": "string (maks 45 karakter)",
  "subtitle": "string (maks 65 karakter)",
  "introEmoji": "string (1 emoji)",
  "accent": "#hexcolor (AI pilih sesuai topik)",
  "layout": "center | side | bold (AI pilih sesuai konten)",
  "caption": "string (caption siap-post TikTok/IG, tanpa hashtag)",
  "hashtags": ["string (10-15 tag tanpa #)"],
  "tips": [
    {
      "title": "string (maks 35 karakter)",
      "subtitle": "string (maks 80 karakter)",
      "emoji": "string",
      "visual": {
        "type": "stat | checklist | bullets | quote | code | comparison",
        "number": "string (stat)",
        "label": "string (stat)",
        "items": ["string x3 (checklist/bullets)"],
        "text": "string (quote)",
        "source": "string (quote, opsional)",
        "lines": ["string x3-4 (code)"],
        "left": "string (comparison)",
        "right": "string (comparison)",
        "leftLabel": "string (comparison)",
        "rightLabel": "string (comparison)"
      }
    }
  ],
  "ctaText": "string",
  "scenes": [
    { "id": "intro",  "text": "narasi 2-3 kalimat" },
    { "id": "tip-1",  "text": "narasi 2-3 kalimat" },
    { "id": "tip-2",  "text": "narasi 2-3 kalimat" },
    { "id": "tip-3",  "text": "narasi 2-3 kalimat" },
    { "id": "tip-4",  "text": "narasi 2-3 kalimat" },
    { "id": "tip-5",  "text": "narasi 2-3 kalimat" },
    { "id": "outro",  "text": "narasi 2 kalimat, sebut @creavoo.id dan creavoo.com" }
  ]
}
```

---

## Layout Video (dipilih AI otomatis)

| Layout | Scene Component | Cocok untuk |
|---|---|---|
| `center` | `TipScene.tsx` | Tips umum, motivasi, insight |
| `side` | `TipSceneSide.tsx` | Tutorial, langkah-langkah, hidden gems |
| `bold` | `TipSceneBold.tsx` | Mistakes, perbandingan, hal mengejutkan |

Semua layout pakai **2-zone absolute positioning** supaya teks tidak overlap:
- Zona atas (~340px dari top): emoji + judul tip
- Zona bawah (~1080px dari top): subtitle fade out → visual block fade in

---

## Visual Blocks per Tip

AI pilih tipe berdasarkan konten. Muncul animasi di 35% durasi scene:

| Type | Tampilan | Cocok untuk |
|---|---|---|
| `stat` | Angka besar + label, glow pulse | Tips dengan metrik/angka |
| `checklist` | 3 item + animated checkmark | Langkah-langkah actionable |
| `bullets` | 3 poin dengan accent dot | Tips generic |
| `quote` | Card dengan tanda kutip besar | Insight/prinsip kuat |
| `code` | Mock terminal + syntax color | Tips teknis/kode |
| `comparison` | Split card ❌ vs ✅ | Pemula vs pro / salah vs benar |

---

## MinIO: Struktur Storage

```
video-{runId}.mp4           ← hasil render video
thumbnail-{runId}.jpg       ← frame detik ke-1, untuk thumbnail TikTok/IG
settings/watermark.json     ← { handle, logoUrl } — watermark setting global
memory/history.json         ← ["topik → judul", ...] max 100 — AI memory
```

---

## AI Memory System

`memory/history.json` di MinIO menyimpan daftar video yang sudah pernah dibuat dalam format `"topik → judul"`.

- Dibaca setiap kali `/api/generate` dipanggil (selalu, regardless `useKnowledge`)
- Disimpan (await) setelah AI berhasil generate — sebelum response dikirim
- Format `"topik → judul"` supaya AI kenali duplikasi meski judulnya berbeda
- Bisa di-reset dari UI Generate → tombol "🗑 Reset memory AI" → modal konfirmasi → `DELETE /api/memory`

---

## Social Media Publish (Zernio)

`/api/publish` mengirim video ke TikTok atau Instagram via Zernio API.

**TikTok:**
```json
{
  "tiktokSettings": {
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "video_cover_image_url": "<thumbnailUrl jika ada>"
  }
}
```

**Instagram (Reels, bukan grid biasa):**
```json
{
  "platformSpecificData": {
    "contentType": "reels",
    "shareToFeed": true,        ← bisa toggle dari UI
    "instagramThumbnail": "<thumbnailUrl jika ada>"
  }
}
```

`shareToFeed: true` = Reels muncul di grid feed profil juga. `false` = hanya di tab Reels.

---

## Halaman Web

| URL | Fungsi |
|---|---|
| `/` | Generate video — topik, voice, knowledge toggle, auto-upload toggle |
| `/results` | List history video, preview, download, delete, upload manual |
| `/analytics` | Dashboard TikTok + Instagram via Zernio |

### Fitur halaman `/` (Generate):
- Input topik + Trending Topics (AI suggest 6 topik)
- Toggle **Ikut Knowledge Creavoo** — ON: script berdasarkan produk Creavoo; OFF: topik digital bebas. Memory tetap dicek di kedua mode.
- Pilih voice: **Ardi** (male) atau **Gadis** (female) — edge-tts only
- Watermark: upload logo + `@handle` — tersimpan ke Blob (bukan localStorage)
- Toggle **Auto Upload TikTok / Instagram** — preferensi disimpan per video di history
- Toggle **Tampil di grid / feed profil** (sub-opsi Instagram) — kontrol `shareToFeed`
- Render state: script preview + inline GitHub Actions steps + frame counter (`23/2406`) + progress bar
- Cancel run button
- Done state: video player + download + upload TikTok/IG + caption & hashtag + copy button
- Tombol **Reset memory AI** (di bawah generate) → modal peringatan → wipe Blob memory

### Fitur `/results`:
- Load dari MinIO (source of truth) + merge dengan localStorage
- Resume polling otomatis untuk video yang masih rendering
- Preview panel: video player, download, upload TikTok/IG, caption & hashtag
- **1 tombol Hapus** per item → delete Blob + delete GitHub Actions run sekaligus

---

## Watermark

- **Handle** (`@namaakun`): input text di form, simpan ke `settings/watermark.json` di Blob
- **Logo**: upload via `/api/upload-logo`, URL tersimpan ke `settings/watermark.json`
- Kalau handle kosong dan tidak ada logo → watermark tidak dirender (tidak ada pill kosong)
- Dibaca saat `/api/render` trigger, dikirim ke GitHub Actions sebagai prop

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
npm run lint  # (dari root)
```

---

## State Terakhir (per 23 Juni 2026)

### Sudah jalan ✅
- Full pipeline: topik → script → TTS → render → upload → download
- edge-tts only (ElevenLabs dihapus sepenuhnya, suara selalu konsisten)
- 3 layout Remotion (center/side/bold) dipilih AI otomatis dari topik
- Dynamic visual blocks per tip (6 tipe, AI pilih, wajib variasi)
- Knowledge-first flow + AI memory (simpan "topik → judul", hindari duplikasi)
- Reset memory dari UI dengan modal konfirmasi
- Watermark (handle + logo) tersimpan di MinIO
- Inline GitHub Actions logs + frame counter + progress bar render
- Results page: load dari Blob, resume polling, 1 tombol hapus (Blob + Action)
- Upload TikTok (dengan thumbnail + tiktokSettings)
- Upload Instagram **Reels** (bukan grid) + toggle shareToFeed + thumbnail
- Auto-upload preferensi tersimpan per video (survive page navigation)
- Caption + hashtag AI-generated, tersimpan di history, bisa copy
- Thumbnail otomatis: ffmpeg extract frame detik ke-1, upload ke Blob
- Analytics page (Zernio)

### Yang belum / potensial next step
- [ ] Tidak ada auth/login — siapapun yang punya URL bisa akses
- [ ] Intro dan Outro scene belum punya visual blocks (masih static)
- [ ] Zernio publish belum confirmed working end-to-end (perlu akun connected + test real)
- [ ] Video lama (sebelum fitur thumbnail) tidak punya thumbnailUrl — Zernio auto-generate
- [ ] localStorage sebagai cache history — bisa hilang kalau clear browser (Blob tetap source of truth)

---

*Last updated: 23 Juni 2026*
