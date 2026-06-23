import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VisualBlock, type VisualData } from "./VisualBlock";

type Props = {
  duration: number;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  bullets?: string[];
  visual?: VisualData;
};

export const TipScene: React.FC<Props> = ({
  duration, number, title, subtitle, emoji, accent, bullets, visual,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.8 } });
  const titleIn = spring({ frame: frame - 25, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });

  const visualStartFrame = Math.floor(duration * 0.35);

  const subtitleFade = interpolate(frame, [visualStartFrame - 10, visualStartFrame + 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emojiFloat = Math.sin(frame * 0.08) * 10;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resolve visual: use `visual` prop if present, else fall back to bullets
  const resolvedVisual: VisualData | null = visual ?? (
    bullets && bullets.length > 0 ? { type: "bullets", items: bullets } : null
  );
  const hasVisual = resolvedVisual !== null;

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center px-12" style={{ gap: 24, width: "100%" }}>
          {/* Number badge */}
          <div
            className="rounded-full flex items-center justify-center font-black"
            style={{
              width: 100, height: 100,
              background: accent, fontSize: 56, color: "white",
              opacity: numIn,
              transform: `scale(${0.5 + numIn * 0.5})`,
              boxShadow: `0 0 40px ${accent}88`,
            }}
          >
            {number}
          </div>

          {/* Emoji */}
          <div
            style={{
              fontSize: 130, lineHeight: 1,
              opacity: emojiIn,
              transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
              filter: `drop-shadow(0 0 30px ${accent}66)`,
            }}
          >
            {emoji}
          </div>

          {/* Title */}
          <p
            className="font-black text-white text-center"
            style={{
              fontSize: 64, lineHeight: 1.1,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 24}px)`,
            }}
          >
            {title}
          </p>

          {/* Subtitle — fades out when visual arrives */}
          <p
            className="font-bold text-zinc-400 text-center"
            style={{
              fontSize: 34, maxWidth: 860, lineHeight: 1.4,
              opacity: hasVisual ? subtitleIn * subtitleFade : subtitleIn,
              transform: `translateY(${(1 - subtitleIn) * 16}px)`,
              position: hasVisual ? "absolute" : "relative",
            }}
          >
            {subtitle}
          </p>

          {/* Visual block */}
          {hasVisual && frame >= visualStartFrame && (
            <div style={{ width: "100%", maxWidth: 920 }}>
              <VisualBlock
                visual={resolvedVisual!}
                frame={frame}
                fps={fps}
                startFrame={visualStartFrame}
                accent={accent}
              />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
