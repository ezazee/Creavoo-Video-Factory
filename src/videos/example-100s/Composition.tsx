import { AbsoluteFill, Sequence, Series, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "../../shared/Background";
import { Watermark } from "../../shared/Watermark";
import { Intro } from "./scenes/Intro";
import { History } from "./scenes/History";
import { Concepts } from "./scenes/Concepts";
import { CodeDemo } from "./scenes/CodeDemo";
import { Ecosystem } from "./scenes/Ecosystem";
import { Outro } from "./scenes/Outro";
import { SCENES, audioPath } from "./voiceover";

// Accent color for this episode — change per video.
export const ACCENT = "#6366f1";

const SCENE_COMPONENTS = {
  intro: Intro,
  history: History,
  concepts: Concepts,
  "code-demo": CodeDemo,
  ecosystem: Ecosystem,
  outro: Outro,
} as const;

// Used when no voiceover audio has been generated yet. Once you run
// `npm run generate-voiceover`, real audio durations override these.
export const FALLBACK_DURATIONS = [180, 320, 360, 320, 280, 160];

export const Example100sComposition: React.FC<{
  sceneDurations: number[];
}> = ({ sceneDurations }) => {
  const durations =
    sceneDurations.length === SCENES.length
      ? sceneDurations
      : FALLBACK_DURATIONS;

  let offset = 0;
  const sceneStarts = durations.map((d) => {
    const start = offset;
    offset += d;
    return start;
  });

  // Only render <Audio> when timing came from real audio files. This lets the
  // studio run on a fresh clone (no MP3s, no API key) without errors.
  const hasAudio = sceneDurations.length === SCENES.length;

  return (
    <AbsoluteFill className="bg-zinc-950 font-sans">
      <Background accent={ACCENT} />
      <Series>
        {SCENES.map((scene, i) => {
          const Component = SCENE_COMPONENTS[scene.id];
          return (
            <Series.Sequence
              key={scene.id}
              durationInFrames={durations[i]}
              premountFor={30}
            >
              <Component duration={durations[i]} />
            </Series.Sequence>
          );
        })}
      </Series>
      {hasAudio &&
        SCENES.map((scene, i) => (
          <Sequence
            key={scene.id}
            from={sceneStarts[i]}
            durationInFrames={durations[i]}
            layout="none"
          >
            <Audio src={staticFile(audioPath(scene.id))} />
          </Sequence>
        ))}
      <Watermark handle="@yourhandle" />
    </AbsoluteFill>
  );
};
