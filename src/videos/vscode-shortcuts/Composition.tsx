import { AbsoluteFill, Sequence, Series, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "../../shared/Background";
import { Watermark } from "../../shared/Watermark";
import { Intro } from "./scenes/Intro";
import { Shortcut1 } from "./scenes/Shortcut1";
import { Shortcut2 } from "./scenes/Shortcut2";
import { Shortcut3 } from "./scenes/Shortcut3";
import { Shortcut4 } from "./scenes/Shortcut4";
import { Shortcut5 } from "./scenes/Shortcut5";
import { Outro } from "./scenes/Outro";
import { SCENES, audioPath } from "./voiceover";

export const ACCENT = "#007ACC";

const SCENE_COMPONENTS = {
  intro: Intro,
  "shortcut-1": Shortcut1,
  "shortcut-2": Shortcut2,
  "shortcut-3": Shortcut3,
  "shortcut-4": Shortcut4,
  "shortcut-5": Shortcut5,
  outro: Outro,
} as const;

export const FALLBACK_DURATIONS = [150, 210, 240, 210, 210, 210, 150];

export const VscodeShortcutsComposition: React.FC<{
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
