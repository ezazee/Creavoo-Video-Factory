import { AbsoluteFill, Sequence, Series, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "../../shared/Background";
import { Watermark } from "../../shared/Watermark";
import { Intro } from "./scenes/Intro";
import { TipScene } from "./scenes/TipScene";
import { Outro } from "./scenes/Outro";
import { SCENE_IDS, audioPath } from "./voiceover";
import type { SceneId } from "./voiceover";

export type TipData = {
  title: string;
  subtitle: string;
  emoji: string;
};

export type GeneratedVideoProps = {
  sceneDurations: number[];
  videoTitle: string;
  subtitle: string;
  introEmoji: string;
  accent: string;
  tips: TipData[];
  ctaText: string;
};

export const DEFAULT_ACCENT = "#6366f1";

export const FALLBACK_DURATIONS = [150, 210, 210, 210, 210, 210, 150];

export const GeneratedVideoComposition: React.FC<GeneratedVideoProps> = ({
  sceneDurations,
  videoTitle,
  subtitle,
  introEmoji,
  accent,
  tips,
  ctaText,
}) => {
  const durations =
    sceneDurations.length === SCENE_IDS.length
      ? sceneDurations
      : FALLBACK_DURATIONS;

  let offset = 0;
  const sceneStarts = durations.map((d) => {
    const start = offset;
    offset += d;
    return start;
  });

  const hasAudio = sceneDurations.length === SCENE_IDS.length;
  const accentColor = accent || DEFAULT_ACCENT;

  return (
    <AbsoluteFill className="bg-zinc-950 font-sans">
      <Background accent={accentColor} />
      <Series>
        <Series.Sequence durationInFrames={durations[0]} premountFor={30}>
          <Intro
            duration={durations[0]}
            videoTitle={videoTitle}
            subtitle={subtitle}
            emoji={introEmoji}
            accent={accentColor}
          />
        </Series.Sequence>

        {tips.map((tip, i) => (
          <Series.Sequence key={i} durationInFrames={durations[i + 1]} premountFor={30}>
            <TipScene
              duration={durations[i + 1]}
              number={i + 1}
              title={tip.title}
              subtitle={tip.subtitle}
              emoji={tip.emoji}
              accent={accentColor}
            />
          </Series.Sequence>
        ))}

        <Series.Sequence durationInFrames={durations[6]} premountFor={30}>
          <Outro
            duration={durations[6]}
            tips={tips}
            accent={accentColor}
            ctaText={ctaText}
          />
        </Series.Sequence>
      </Series>

      {hasAudio &&
        SCENE_IDS.map((id, i) => (
          <Sequence
            key={id}
            from={sceneStarts[i]}
            durationInFrames={durations[i]}
            layout="none"
          >
            <Audio src={staticFile(audioPath(id as SceneId))} />
          </Sequence>
        ))}

      <Watermark handle="@yourhandle" />
    </AbsoluteFill>
  );
};
