"""
Generate voiceover MP3s using Microsoft Edge TTS — free, no API key needed.

Install: pip install edge-tts
Usage:
  python scripts/generate_voiceover_edge.py
  python scripts/generate_voiceover_edge.py --video vscode-shortcuts
  python scripts/generate_voiceover_edge.py --force
  python scripts/generate_voiceover_edge.py --list-voices

Default voice: en-US-GuyNeural
Override:  set EDGE_TTS_VOICE env var, or pass --voice
"""

import asyncio
import os
import sys
import argparse
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("edge-tts not installed. Run: pip install edge-tts")
    sys.exit(1)

VOICE = os.environ.get("EDGE_TTS_VOICE", "id-ID-ArdiNeural")
PUBLIC_DIR = Path(__file__).parent.parent / "public"

# ── Video registry ────────────────────────────────────────────────────────────
# Add new videos here when you scaffold them. Keep text in sync with voiceover.ts
VIDEOS = {
    "vscode-shortcuts": {
        "video_id": "vscode-shortcuts",
        "scenes": [
            {
                "id": "intro",
                "text": "Masih klik-klik folder buat buka file? Lima shortcut VS Code ini bakal bikin kamu keliatan pro — dan cuma butuh enam puluh detik buat belajarnya. Gas!",
            },
            {
                "id": "shortcut-1",
                "text": "Pertama, Control P. Cari file apapun dengan fuzzy search. Ketik sebagian nama file, langsung lompat ke sana — nggak perlu scroll-scroll sidebar lagi.",
            },
            {
                "id": "shortcut-2",
                "text": "Kedua, Control Shift P. Command Palette — cheat code untuk semua yang bisa dilakukan VS Code. Jalankan task, ubah settings, install extension, semua tanpa sentuh mouse.",
            },
            {
                "id": "shortcut-3",
                "text": "Ketiga, Control D. Pilih kemunculan kata berikutnya. Terus pencet buat pilih lebih banyak, lalu ketik sekali untuk rename semuanya sekaligus.",
            },
            {
                "id": "shortcut-4",
                "text": "Keempat, Alt plus Klik. Taruh banyak kursor di mana saja. Edit sepuluh tempat sekaligus — cocok banget buat rename variabel atau benerin pola yang berulang.",
            },
            {
                "id": "shortcut-5",
                "text": "Kelima, Control Backtick. Toggle terminal langsung tanpa keluar dari editor. Kode dan terminal kamu, berdampingan.",
            },
            {
                "id": "outro",
                "text": "Lima shortcut, nol klik mouse. Yang mana yang paling bikin kamu wow? Tulis di komentar — dan follow buat tips dev tiap minggu!",
            },
        ],
    },
}


async def generate_scene(video_id, scene_id, text, voice, force):
    out_file = PUBLIC_DIR / "voiceover" / video_id / f"{scene_id}.mp3"

    if out_file.exists() and not force:
        print(f"✓ [{video_id}] {scene_id} (cached)")
        return

    print(f"→ [{video_id}] generating {scene_id} with voice {voice}…")
    out_file.parent.mkdir(parents=True, exist_ok=True)

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_file))
    print(f"✓ [{video_id}] {scene_id} → {out_file}")


async def list_voices():
    voices = await edge_tts.list_voices()
    for v in voices:
        print(f"{v['ShortName']:40s}  {v['Gender']:8s}  {v['Locale']}")


async def main():
    parser = argparse.ArgumentParser(description="Edge TTS voiceover generator")
    parser.add_argument("--video", help="Video slug (default: all)")
    parser.add_argument("--voice", default=VOICE, help="Edge TTS voice name")
    parser.add_argument("--force", action="store_true", help="Re-generate even if cached")
    parser.add_argument("--list-voices", action="store_true", help="List all available voices")
    args = parser.parse_args()

    if args.list_voices:
        await list_voices()
        return

    if args.video and args.video not in VIDEOS:
        print(f"Unknown video: {args.video}")
        print(f"Available: {', '.join(VIDEOS.keys())}")
        sys.exit(1)

    targets = {args.video: VIDEOS[args.video]} if args.video else VIDEOS

    for video_id, video in targets.items():
        for scene in video["scenes"]:
            await generate_scene(video_id, scene["id"], scene["text"], args.voice, args.force)

    print("done.")


if __name__ == "__main__":
    asyncio.run(main())
