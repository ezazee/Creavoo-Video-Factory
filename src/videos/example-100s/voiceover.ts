// ───────────────────────────────────────────────────────────────────────────
// EXAMPLE VIDEO — "X in 100 Seconds" archetype.
// This is a PLACEHOLDER. Edit the text below, rename the folder, and you have
// your own episode. Scene timing is derived from the generated voiceover audio
// (see scripts/generate-voiceover.ts); until you generate audio, the built-in
// fallback durations in Composition.tsx are used so the studio runs instantly.
// ───────────────────────────────────────────────────────────────────────────

export const VIDEO_ID = "example-100s";

export type SceneId =
  | "intro"
  | "history"
  | "concepts"
  | "code-demo"
  | "ecosystem"
  | "outro";

export const SCENES: { id: SceneId; text: string }[] = [
  {
    id: "intro",
    text: "Scared of breaking your code or losing progress?... Meet Git — a time machine for your code. In one hundred seconds, let's go!",
  },
  {
    id: "history",
    text: "Created in 2005 by Linus Torvalds — the same person who made Linux. Today it's the most popular version control system in the world, used by nearly every developer.",
  },
  {
    id: "concepts",
    text: "Three key ideas. First, commit — a snapshot of your code you can return to anytime. Second, branch — experiment safely, then merge back when ready. Third, distributed — every clone has the full history, so you can work offline.",
  },
  {
    id: "code-demo",
    text: "The basic flow is simple. Start with git init, then git add to stage changes, git commit to save a snapshot, branch to experiment, and merge to bring it together. Every commit is recorded and reversible.",
  },
  {
    id: "ecosystem",
    text: "The ecosystem is huge. GitHub for hosting and collaboration, GitLab with full CI/CD, plus built-in integration in almost every editor.",
  },
  {
    id: "outro",
    text: "That's Git in one hundred seconds. What topic should I cover next? Drop it in the comments!",
  },
];

export const audioPath = (id: SceneId) => `voiceover/${VIDEO_ID}/${id}.mp3`;
