import { AbsoluteFill, Sequence, Series, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "../../shared/Background";
import { Watermark } from "../../shared/Watermark";
import { Intro } from "./scenes/Intro";
import { TipScene } from "./scenes/TipScene";
import { TipSceneSide } from "./scenes/TipSceneSide";
import { TipSceneBold } from "./scenes/TipSceneBold";
import { Outro } from "./scenes/Outro";
import { SCENE_IDS, audioPath } from "./voiceover";
import type { SceneId } from "./voiceover";
import type { VisualData } from "./scenes/VisualBlock";

export type TipData = {
  title: string;
  subtitle: string;
  emoji: string;
  bullets?: string[];
  visual?: VisualData;
};

export type VideoLayout = "center" | "side" | "bold";

export type GeneratedVideoProps = {
  sceneDurations: number[];
  videoTitle: string;
  subtitle: string;
  introEmoji: string;
  accent: string;
  tips: TipData[];
  ctaText: string;
  layout?: VideoLayout;
  watermarkHandle?: string;
  watermarkLogo?: string; // filename di public/, e.g. "logo.png"
  profile?: "creavoo" | "zaportfolio";
};

export const DEFAULT_ACCENT = "#6366f1";

export const FALLBACK_DURATIONS = [150, 210, 210, 210, 210, 210, 150];

const TIP_SCENE_MAP: Record<VideoLayout, React.FC<{ duration: number; number: number; title: string; subtitle: string; emoji: string; accent: string; bullets?: string[]; visual?: VisualData; profile?: "creavoo" | "zaportfolio" }>> = {
  center: TipScene,
  side: TipSceneSide,
  bold: TipSceneBold,
};

export const GeneratedVideoComposition: React.FC<GeneratedVideoProps> = ({
  sceneDurations,
  videoTitle,
  subtitle,
  introEmoji,
  accent,
  tips,
  ctaText,
  layout = "center",
  watermarkHandle = "",
  watermarkLogo,
  profile = "creavoo",
}) => {
  const TipComponent = TIP_SCENE_MAP[layout] ?? TipScene;
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

  const isZaportfolio = profile === "zaportfolio";

  return (
    <AbsoluteFill className="bg-zinc-950 font-sans">
      <Background accent={accentColor} profile={profile} />
      <Series>
        <Series.Sequence durationInFrames={durations[0]} premountFor={30}>
          <Intro
            duration={durations[0]}
            videoTitle={videoTitle}
            subtitle={subtitle}
            emoji={introEmoji}
            accent={accentColor}
            profile={profile}
          />
        </Series.Sequence>

        {tips.map((tip, i) => (
          <Series.Sequence key={i} durationInFrames={durations[i + 1]} premountFor={30}>
            <TipComponent
              duration={durations[i + 1]}
              number={i + 1}
              title={tip.title}
              subtitle={tip.subtitle}
              emoji={tip.emoji}
              accent={isZaportfolio ? "#1a3358" : accentColor}
              bullets={tip.bullets}
              visual={tip.visual}
              profile={profile}
            />
          </Series.Sequence>
        ))}

        <Series.Sequence durationInFrames={durations[6]} premountFor={30}>
          <Outro
            duration={durations[6]}
            tips={tips}
            accent={isZaportfolio ? "#1a3358" : accentColor}
            ctaText={ctaText}
            profile={profile}
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

      {watermarkLogo && <Watermark handle="" avatarFile={watermarkLogo} position="top-left" />}
      <Watermark handle={watermarkHandle} position="top-right" />
    </AbsoluteFill>
  );
};
