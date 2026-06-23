# Dev Shorts Template (Free) — Remotion + ElevenLabs

A starter for **faceless vertical (1080×1920, 30fps) developer short-form videos** for TikTok / Reels / YouTube Shorts.

Each video is a single [Remotion](https://remotion.dev) composition narrated by an [ElevenLabs](https://elevenlabs.io) voiceover, and **scene timing is derived from the audio** — you write the script, generate the narration, and the visuals automatically fit the voice.

> This is the **FREE** tier — the core engine + one example video. A **PRO** tier with more components, video archetypes, and a publishing playbook is available (see below).

---

## Quick start

```bash
# 1. Install
npm install

# 2. Open the studio (works immediately — no API key needed)
npm run dev
```

On a fresh clone there are no audio files yet, so the example uses built-in
fallback durations. Open the `Example100s` composition and you'll see it render.

To get **audio-driven** timing + real narration:

```bash
# 3. Add your ElevenLabs key
cp .env.example .env
#   then edit .env and set ELEVENLABS_API_KEY=...

# 4. Generate the voiceover
npm run generate-voiceover

# 5. Reopen the studio — timing now matches the narration
npm run dev
```

Render a video:

```bash
npx remotion render Example100s out/example.mp4
```

---

## How it works

```
src/
  Root.tsx                 # registers compositions; derives duration from audio
  shared/                  # reusable visual primitives
    Background.tsx         #   animated gradient + grid (accent per video)
    Watermark.tsx          #   your @handle (set the prop)
    Caption.tsx            #   lower-third caption
    TerminalMock.tsx       #   terminal window chrome
    get-audio-duration.ts  #   reads MP3 length (mediabunny)
  videos/
    example-100s/          # one video = one folder
      voiceover.ts         #   the script (single source of truth)
      Composition.tsx      #   wires scenes + audio + accent
      scenes/*.tsx         #   one component per scene
scripts/
  generate-voiceover.ts    # ElevenLabs TTS → public/voiceover/<id>/<scene>.mp3
```

**Audio-driven duration:** `Root.tsx` reads each scene's MP3 length and converts
it to frames. If the MP3s don't exist yet, it falls back to the per-scene
`FALLBACK_DURATIONS` in the composition so the studio always runs.

### Add a new video (4 steps)

1. Copy `src/videos/example-100s/` to `src/videos/your-topic/` and edit
   `voiceover.ts` (change `VIDEO_ID`, the `SCENES` text, and the accent).
2. Tweak the scene components under `scenes/` to match your script.
3. Register it in `src/Root.tsx` (add a `<Composition>`) and in
   `scripts/generate-voiceover.ts` (add it to the `VIDEOS` map).
4. `npm run generate-voiceover -- --video your-topic`, then `npm run dev`.

Scripts can be in **any language** — ElevenLabs `eleven_multilingual_v2` handles
many. See [`SCRIPT_GUIDE.md`](./SCRIPT_GUIDE.md) for writing tips.

---

## Free vs PRO

| | Free (this repo) | PRO |
|---|---|---|
| Core engine (audio-driven timing, TTS pipeline) | ✅ | ✅ |
| Shared primitives | Background, Watermark, Caption, TerminalMock | + Editor / VS Code frame, KeyboardKey, permission-prompt chrome, corner series stamps |
| Video archetypes | 1 ("X in 100s") | 5+ ("100s", CLI tip, editor showcase, tutorial series, news/release) |
| Series system | — | chain "next episode" teasers + per-series branding |
| Script & voice | basic guide | full script playbook + per-letter phonetic guide for TTS |
| Publishing | — | caption/title/overlay playbook per platform + hook formulas |
| Claude Code | ✅ includes `CLAUDE.md` (agent-ready) | + full `USING_WITH_CLAUDE_CODE.md` guide + AI prompt template |

**[Get the PRO template →](https://lynk.id/warsono.dev/qyx75m98n4xk)**

---

## Licensing — read before commercial use

This template ships **two layers of licensing**, keep them separate:

1. **This template's own code** — covered by [`LICENSE.md`](./LICENSE.md). You may
   use it to make your own videos/products; you may **not** resell or redistribute
   the template itself.
2. **Remotion** (the rendering library this is built on) — Remotion has **its own
   license** and is **not** MIT. It's **free** for individuals, non-profits, and
   for-profit companies with **up to 3 employees**; larger companies need a paid
   **Company License**. You must comply with it independently of this template.
   See <https://remotion.dev/license>. When in doubt, contact the Remotion team.
3. **ElevenLabs** — you need **your own API key** and must follow ElevenLabs'
   terms (including voice/usage and commercial-use rules) for any audio you
   generate.

This template is provided **as is**, without warranty of any kind.
