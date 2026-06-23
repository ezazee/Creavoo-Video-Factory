import "./index.css";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { getAudioDuration } from "./shared/get-audio-duration";
import {
  Example100sComposition,
  FALLBACK_DURATIONS,
} from "./videos/example-100s/Composition";
import * as example100s from "./videos/example-100s/voiceover";
import {
  VscodeShortcutsComposition,
  FALLBACK_DURATIONS as VSCODE_FALLBACK,
} from "./videos/vscode-shortcuts/Composition";
import * as vscodeShortcuts from "./videos/vscode-shortcuts/voiceover";
import {
  GeneratedVideoComposition,
  FALLBACK_DURATIONS as GEN_FALLBACK,
  type GeneratedVideoProps,
} from "./videos/generated/Composition";
import { SCENE_IDS, audioPath as genAudioPath } from "./videos/generated/voiceover";

const FPS = 30;
const TAIL_BUFFER_FRAMES = 12;

type Props = {
  sceneDurations: number[];
};

/**
 * Scene timing is derived from the generated voiceover audio. If the audio
 * files don't exist yet (fresh clone, before running generate-voiceover), we
 * fall back to `fallback` durations so the studio still runs — no API key
 * needed to preview. Once you generate audio, timing becomes audio-accurate.
 */
const makeMetadataGenerated = (
  fallback: number[],
): CalculateMetadataFunction<GeneratedVideoProps> => {
  return async ({ props }) => {
    try {
      const seconds = await Promise.all(
        SCENE_IDS.map((id) => getAudioDuration(staticFile(genAudioPath(id)))),
      );
      const sceneDurations = seconds.map(
        (s) => Math.ceil(s * FPS) + TAIL_BUFFER_FRAMES,
      );
      return {
        durationInFrames: sceneDurations.reduce((sum, d) => sum + d, 0),
        props: { ...props, sceneDurations },
      };
    } catch {
      return {
        durationInFrames: fallback.reduce((sum, d) => sum + d, 0),
        props: { ...props, sceneDurations: [] },
      };
    }
  };
};

const makeMetadata = (
  scenes: { id: string }[],
  audioPath: (id: string) => string,
  fallback: number[],
): CalculateMetadataFunction<Props> => {
  return async () => {
    try {
      const seconds = await Promise.all(
        scenes.map((s) => getAudioDuration(staticFile(audioPath(s.id)))),
      );
      const sceneDurations = seconds.map(
        (s) => Math.ceil(s * FPS) + TAIL_BUFFER_FRAMES,
      );
      return {
        durationInFrames: sceneDurations.reduce((sum, d) => sum + d, 0),
        props: { sceneDurations },
      };
    } catch {
      // Audio not generated yet — use fallback durations. Returning an empty
      // sceneDurations array tells the composition to use its own fallback and
      // to skip rendering <Audio> (so missing files don't error).
      return {
        durationInFrames: fallback.reduce((sum, d) => sum + d, 0),
        props: { sceneDurations: [] },
      };
    }
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Example100s"
        component={Example100sComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={1800}
        defaultProps={{ sceneDurations: [] }}
        calculateMetadata={makeMetadata(
          example100s.SCENES,
          (id) => example100s.audioPath(id as example100s.SceneId),
          FALLBACK_DURATIONS,
        )}
      />
      <Composition
        id="VscodeShortcuts"
        component={VscodeShortcutsComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={1380}
        defaultProps={{ sceneDurations: [] }}
        calculateMetadata={makeMetadata(
          vscodeShortcuts.SCENES,
          (id) => vscodeShortcuts.audioPath(id as vscodeShortcuts.SceneId),
          VSCODE_FALLBACK,
        )}
      />
      <Composition
        id="GeneratedVideo"
        component={GeneratedVideoComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={1350}
        defaultProps={{
          sceneDurations: [],
          videoTitle: "5 Tips Dev",
          subtitle: "yang wajib kamu tahu",
          introEmoji: "🚀",
          accent: "#6366f1",
          tips: [
            { title: "Tip 1", subtitle: "Deskripsi tip 1", emoji: "💡" },
            { title: "Tip 2", subtitle: "Deskripsi tip 2", emoji: "⚡" },
            { title: "Tip 3", subtitle: "Deskripsi tip 3", emoji: "🎯" },
            { title: "Tip 4", subtitle: "Deskripsi tip 4", emoji: "🔥" },
            { title: "Tip 5", subtitle: "Deskripsi tip 5", emoji: "✨" },
          ],
          ctaText: "Tulis di komentar 👇",
          layout: "center",
        }}
        calculateMetadata={makeMetadataGenerated(GEN_FALLBACK)}
      />
    </>
  );
};
