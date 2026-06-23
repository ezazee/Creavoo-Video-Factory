import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  duration: number;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
};

export const TipSceneSide: React.FC<Props> = ({
  duration,
  number,
  title,
  subtitle,
  emoji,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barIn = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
  const numIn = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 15, fps, config: { damping: 12, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 30, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 48, fps, config: { damping: 16 } });

  const emojiFloat = Math.sin(frame * 0.07) * 8;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: interpolate(barIn, [0, 1], [0, 12]),
          height: "100%",
          background: accent,
          boxShadow: `0 0 60px ${accent}88`,
        }}
      />

      {/* Number — large background watermark */}
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -40,
          fontSize: 600,
          fontWeight: 900,
          color: `${accent}10`,
          lineHeight: 1,
          fontFamily: "sans-serif",
          userSelect: "none",
        }}
      >
        {number}
      </div>

      {/* Content — left-aligned */}
      <AbsoluteFill
        style={{
          paddingLeft: 72,
          paddingRight: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            fontWeight: 900,
            color: "white",
            marginBottom: 40,
            opacity: numIn,
            transform: `scale(${0.5 + numIn * 0.5})`,
            boxShadow: `0 0 30px ${accent}88`,
          }}
        >
          {number}
        </div>

        {/* Emoji */}
        <div
          style={{
            fontSize: 140,
            lineHeight: 1,
            marginBottom: 36,
            opacity: emojiIn,
            transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
            filter: `drop-shadow(0 0 24px ${accent}66)`,
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 24,
            opacity: titleIn,
            transform: `translateX(${(1 - titleIn) * -30}px)`,
          }}
        >
          {title}
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: "#a1a1aa",
            lineHeight: 1.4,
            maxWidth: 900,
            opacity: subtitleIn,
            transform: `translateX(${(1 - subtitleIn) * -20}px)`,
          }}
        >
          {subtitle}
        </p>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(titleIn, [0, 1], [0, 120]),
            height: 6,
            background: accent,
            borderRadius: 3,
            marginTop: 40,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
