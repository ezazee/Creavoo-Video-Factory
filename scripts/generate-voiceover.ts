// ───────────────────────────────────────────────────────────────────────────
// Generate ElevenLabs voiceover MP3s for each video's scenes.
//
//   npm run generate-voiceover                 # all registered videos
//   npm run generate-voiceover -- --video example-100s
//   npm run generate-voiceover -- --force      # re-generate even if cached
//
// Requires ELEVENLABS_API_KEY in .env (copy .env.example). Files are written to
// public/voiceover/<VIDEO_ID>/<sceneId>.mp3 and are cached by existence.
//
// To add a video: create src/videos/<slug>/voiceover.ts, then import it below
// and add it to the VIDEOS map.
// ───────────────────────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import * as example100s from "../src/videos/example-100s/voiceover.ts";
import * as vscodeShortcuts from "../src/videos/vscode-shortcuts/voiceover.ts";

// Minimal .env loader (no dotenv dependency).
const ENV_PATH = join(__dirname, "..", ".env");
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
// Default voice: "Liam" (a multilingual ElevenLabs voice). Override via
// ELEVENLABS_VOICE_ID in .env, or per-video by exporting VOICE_ID from its
// voiceover.ts.
const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? "TX3LPaxmHKxFdv7VOQHJ";

if (!API_KEY) {
  console.error(
    "Missing ELEVENLABS_API_KEY in .env (copy .env.example to .env first)",
  );
  process.exit(1);
}

const PUBLIC_DIR = join(__dirname, "..", "public");

// Register your videos here ↓
const VIDEOS = {
  "example-100s": example100s,
  "vscode-shortcuts": vscodeShortcuts,
} as const;

type VideoKey = keyof typeof VIDEOS;

const videoArgIdx = process.argv.findIndex((a) => a === "--video");
const videoArg =
  videoArgIdx >= 0 ? (process.argv[videoArgIdx + 1] as VideoKey) : null;
const force = process.argv.includes("--force");

async function generate(
  videoId: string,
  voiceId: string,
  scene: { id: string; text: string },
) {
  const outFile = join(PUBLIC_DIR, `voiceover/${videoId}`, `${scene.id}.mp3`);

  if (existsSync(outFile) && !force) {
    console.log(`✓ [${videoId}] ${scene.id} (cached)`);
    return;
  }

  console.log(`→ [${videoId}] generating ${scene.id} with voice ${voiceId}…`);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: scene.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ [${videoId}] ${scene.id} → ${outFile}`);
}

const targets: VideoKey[] = videoArg
  ? [videoArg]
  : (Object.keys(VIDEOS) as VideoKey[]);

async function main() {
  for (const key of targets) {
    const mod = VIDEOS[key];
    if (!mod) {
      console.error(`Unknown video: ${key}`);
      process.exit(1);
    }
    const voiceId =
      "VOICE_ID" in mod ? (mod.VOICE_ID as string) : DEFAULT_VOICE_ID;
    for (const scene of mod.SCENES) {
      await generate(mod.VIDEO_ID, voiceId, scene);
    }
  }
  console.log("done.");
}

main();
