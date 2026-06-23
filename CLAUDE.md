# CLAUDE.md

Guidance for Claude Code (claude.com/claude-code) when working in this repository.

This is the **FREE / starter** tier of a faceless **vertical (1080×1920, 30fps) dev short-form video factory** built with **Remotion + ElevenLabs**, and it works great with Claude Code — describe a video in plain language and Claude can scaffold the module, generate the voiceover, and render it. It ships the core engine + **one** example video.

## Commands

- `npm run dev` — Remotion Studio (preview, hot reload). Works instantly even with no audio (see fallback below).
- `npm run generate-voiceover` — generate ElevenLabs MP3s for all videos. Scope with `-- --video <slug>` (slug = directory name under `src/videos/`, e.g. `example-100s`). Requires `ELEVENLABS_API_KEY` in `.env` (copy `.env.example`). MP3s already present are reused (cache-by-existence).
- `npx remotion render <CompositionId> out/video.mp4` — render one composition (IDs are the `id` props in `src/Root.tsx`; the example is `Example100s`).
- `npm run lint` — `eslint src && tsc` (no emit).

## Architecture

Each video is one Remotion composition driven by an audio track of voiceover scenes; **visuals are timed to the audio**, not the other way around.

### Per-video module shape

Every video lives in `src/videos/<slug>/`:

1. **`voiceover.ts`** — single source of truth: exports `VIDEO_ID`, `SceneId` (string-literal union), `SCENES: { id: SceneId; text: string }[]`, and `audioPath(id)` → `voiceover/<VIDEO_ID>/<id>.mp3`. Both the TTS script and `Root.tsx` consume this.
2. **`scenes/<SceneId>.tsx`** — one component per scene id, accepting `{ duration: number }`, using `useCurrentFrame()` for animation. The id→component map lives in `Composition.tsx`.
3. **`Composition.tsx`** — `<Background>` + `<Series>` of `Series.Sequence` (one per scene in `SCENES` order) + a parallel `SCENES.map` of `<Sequence layout="none">` holding `<Audio>` from `@remotion/media`, plus `<Watermark>`. Exports a `FALLBACK_DURATIONS` array used when the `sceneDurations` prop is empty.

The example is `src/videos/example-100s/` — an "X in 100 Seconds" explainer (scenes: `intro`, `history`, `concepts`, `code-demo`, `ecosystem`, `outro`), composition id **`Example100s`**.

### Duration is computed from audio (with graceful fallback)

`src/Root.tsx` defines `makeMetadata(scenes, audioPath, fallback)`:
- Reads each scene's MP3 length via `getAudioDuration(staticFile(...))`, converts seconds → frames at `FPS = 30` (+ a small tail buffer).
- **If audio is missing it does NOT crash** — it returns `sceneDurations: []` and the Composition uses its `FALLBACK_DURATIONS`. So `npm run dev` works on a fresh clone with no API key; once you generate audio, timing becomes audio-driven automatically.

### Shared building blocks (`src/shared/`)

`Background` (animated gradient + grid, accent per video), `Watermark` (your `@handle`), `Caption` (lower-third), `TerminalMock` (terminal chrome), `get-audio-duration`. Reuse these instead of rebuilding chrome.

## Adding a new video (steps for Claude Code to follow)

1. Copy `src/videos/example-100s/` to `src/videos/<slug>/`.
2. Edit `voiceover.ts`: set `VIDEO_ID = "<slug>"`, the `SceneId` union, and the `SCENES` text.
3. Adjust `scenes/<SceneId>.tsx` for each scene id, and the `SCENE_COMPONENTS` map + `FALLBACK_DURATIONS` in `Composition.tsx`.
4. Register in `src/Root.tsx`: import the composition + `import * as <slug> from "./videos/<slug>/voiceover"`, add a `<Composition id="…" width={1080} height={1920} fps={30} defaultProps={{ sceneDurations: [] }} calculateMetadata={makeMetadata(<slug>.SCENES, (id) => <slug>.audioPath(id as <slug>.SceneId), <slug>FALLBACK)} />`.
5. Add the slug to the `VIDEOS` map in `scripts/generate-voiceover.ts`.
6. `npm run generate-voiceover -- --video <slug>`, then `npm run dev`, then `npx remotion render <CompositionId> out/<slug>.mp4`.

## Script-writing conventions (for `voiceover.ts` text)

See `SCRIPT_GUIDE.md`. Two TTS rules that bite if ignored:

- **Numbers & symbols as spoken words.** Write `"six aliases"` not `"6 aliases"`, `"dot"` not `"."` — otherwise the TTS reads them wrong.
- **Per-letter phonetics for acronyms/aliases.** An English TTS voice mis-reads lowercase shell aliases; write them CAPITAL + SPACED in the audio text (e.g. `gs` → `G S`, `.zshrc` → `zsh R C`). Common acronyms (`API`, `JSON`, `URL`) can stay as-is. **On-screen visuals keep the real form** — only the spoken text is phoneticized.

## Upgrade ke PRO

This FREE tier = the core engine + **1** archetype + basic components. The **PRO** template adds a lot more (and is built to be driven by Claude Code end-to-end):

- **4 video archetypes** ready to copy: Explainer, CLI tip, Editor showcase, Series episode.
- **10+ shared components**: EditorMock, VSCodeFrame, KeyboardKey/KeyCombo, PromptBox, SeriesStamp, SplitFrame, and more.
- **`PROMPT_TEMPLATE.md`** — paste-into-AI script generator (write a full voiceover script from a topic).
- **`CAPTION_PLAYBOOK.md`** — title angles, caption lengths, overlays, hashtags per platform.
- **`USING_WITH_CLAUDE_CODE.md`** — the full describe→scaffold→generate→render workflow + example prompts.
- **Series/teaser-chain system**, full **DOCS.md**, and **lifetime updates**.

→ **Get PRO:** https://lynk.id/warsono.dev/qyx75m98n4xk
