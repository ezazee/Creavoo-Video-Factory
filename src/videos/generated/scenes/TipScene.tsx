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
  const titleIn = spring({ frame: frame - 24, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 44, fps, config: { damping: 16 } });

  const resolvedVisual: VisualData | null = visual ?? (
    bullets && bullets.length > 0 ? { type: "bullets", items: bullets } : null
  );
  const hasVisual = resolvedVisual !== null;

  const visualStartFrame = Math.floor(duration * 0.42);

  const subtitleOpacity = hasVisual
    ? interpolate(frame, [visualStartFrame - 10, visualStartFrame + 6], [subtitleIn, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : subtitleIn;
  const visualOpacity = interpolate(frame, [visualStartFrame, visualStartFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const emojiFloat = Math.sin(frame * 0.08) * 8;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* ZONA ATAS — number badge + emoji + title. Terkunci, tidak bergerak. */}
      <div style={{
        position: "absolute", top: 340, left: 80, right: 80,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, fontWeight: 900, color: "white", marginBottom: 28,
          opacity: numIn, transform: `scale(${0.5 + numIn * 0.5})`,
          boxShadow: `0 0 30px ${accent}88`,
        }}>
          {number}
        </div>
        <div style={{
          fontSize: 100, lineHeight: 1, marginBottom: 28,
          opacity: emojiIn, transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
          filter: `drop-shadow(0 0 24px ${accent}66)`,
        }}>
          {emoji}
        </div>
        <p style={{
          fontSize: 64, fontWeight: 900, color: "white", textAlign: "center",
          lineHeight: 1.1, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 24}px)`,
        }}>
          {title}
        </p>
      </div>

      {/* ZONA BAWAH — subtitle & visual berbagi slot absolute yang SAMA. */}
      <div style={{
        position: "absolute", top: 1080, left: 80, right: 80, bottom: 200,
      }}>
        <p style={{
          position: "absolute", top: 0, left: 0, right: 0,
          fontSize: 34, fontWeight: 600, color: "#a1a1aa", textAlign: "center",
          lineHeight: 1.4, opacity: subtitleOpacity,
          transform: `translateY(${(1 - subtitleIn) * 16}px)`,
        }}>
          {subtitle}
        </p>

        {hasVisual && frame >= visualStartFrame - 4 && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, opacity: visualOpacity }}>
            <VisualBlock visual={resolvedVisual!} frame={frame} fps={fps} startFrame={visualStartFrame} accent={accent} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
