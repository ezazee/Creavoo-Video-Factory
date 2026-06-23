# Script Guide (Lite)

How to write voiceover scripts that sound good and time well. Each scene is
~6–8 seconds spoken (2–3 short sentences). Keep it punchy.

## Structure: hook → body → CTA

**Hook (first ~3 seconds).** Open with a pain or curiosity, pause, then reveal.
A reliable formula:

> "Still [doing the painful thing]?... Here's [the solution]!"

The literal `...` inserts a TTS pause — it makes the reveal land.

**Body.** One idea per scene. Use conversational connectors ("So…", "Here's the
thing…", "The result?") and concrete specifics ("built in Rust") over vague
claims ("it's faster").

**CTA.** Soft suggestion + an open question:

> "Try it at [link]. What should I cover next? Comment below!"

## TTS-friendly writing (important)

Text-to-speech reads literally. Spell things out:

- **Numbers as words** — write "three tips", not "3 tips".
- **Symbols as words** — write "dot", "slash", "tilde", not `.` `/` `~`.
- **Acronyms** — common ones (API, JSON, URL, HTML) are usually fine as-is.
- **Shell aliases / abbreviations** get mangled. Force letter-by-letter reading
  by writing them as **capitals with spaces**:
  - `gs` → `G S`  ·  `gp` → `G P`  ·  `.zshrc` → `zsh R C`
  - On screen (in the visuals) still show the real form (`gs`, `.zshrc`) — only
    the spoken text in `voiceover.ts` is phoneticized.

> Tip: this varies by voice. Generate a quick sample and listen before committing
> a whole video. The default voice is a multilingual English voice; if you write
> in another language, test a non-default voice from your ElevenLabs library.

## Pacing checklist

- 5–7 scenes total for a ~60–100s video.
- End each scene on a mini-punchline or a hook into the next.
- Match on-screen text to what's being said at that moment.
- Read it out loud once — if you stumble, the TTS will too.
