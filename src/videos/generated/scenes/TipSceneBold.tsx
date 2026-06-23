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
  bullets?: string[];
};

export const TipSceneBold: React.FC<Props> = ({
  duration,
  number,
  title,
  subtitle,
  emoji,
  accent,
  bullets = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgNumIn = spring({ frame, fps, config: { damping: 20 } });
  const emojiIn = spring({ frame: frame - 8, fps, config: { damping: 11, mass: 0.6 } });
  const titleIn = spring({ frame: frame - 22, fps, config: { damping: 15 } });
  const lineIn = spring({ frame: frame - 38, fps, config: { damping: 18, stiffness: 120 } });
  const subtitleIn = spring({ frame: frame - 44, fps, config: { damping: 16 } });
  const numBadgeIn = spring({ frame: frame - 55, fps, config: { damping: 14 } });

  const b1Frame = Math.floor(duration * 0.35);
  const b2Frame = Math.floor(duration * 0.54);
  const b3Frame = Math.floor(duration * 0.70);

  const bullet1In = spring({ frame: frame - b1Frame, fps, config: { damping: 13, stiffness: 100 } });
  const bullet2In = spring({ frame: frame - b2Frame, fps, config: { damping: 13, stiffness: 100 } });
  const bullet3In = spring({ frame: frame - b3Frame, fps, config: { damping: 13, stiffness: 100 } });
  const bulletIns = [bullet1In, bullet2In, bullet3In];

  const subtitleFade = interpolate(frame, [b1Frame - 10, b1Frame + 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emojiFloat = Math.sin(frame * 0.09) * 14;
  const pulse = 1 + Math.sin(frame * 0.18) * 0.025;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hasBullets = bullets.length > 0;

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Top accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />

      {/* Huge background number */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 800,
          fontWeight: 900,
          color: `${accent}08`,
          lineHeight: 1,
          fontFamily: "sans-serif",
          userSelect: "none",
          opacity: bgNumIn,
        }}
      >
        {number}
      </div>

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 0,
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: 160,
            lineHeight: 1,
            marginBottom: 40,
            opacity: emojiIn,
            transform: `scale(${0.5 + emojiIn * 0.5}) translateY(${emojiFloat}px) scale(${pulse})`,
            filter: `drop-shadow(0 0 40px ${accent}88)`,
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 84,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 28,
            opacity: titleIn,
            transform: `scale(${0.85 + titleIn * 0.15})`,
            letterSpacing: "-1px",
          }}
        >
          {title}
        </p>

        {/* Accent divider */}
        <div
          style={{
            width: interpolate(lineIn, [0, 1], [0, 180]),
            height: 5,
            background: accent,
            borderRadius: 3,
            marginBottom: 28,
            boxShadow: `0 0 20px ${accent}`,
          }}
        />

        {/* Subtitle — fades as bullets arrive */}
        <p
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: "#a1a1aa",
            textAlign: "center",
            lineHeight: 1.45,
            maxWidth: 880,
            marginBottom: hasBullets ? 0 : 0,
            opacity: hasBullets ? subtitleIn * subtitleFade : subtitleIn,
            transform: `translateY(${(1 - subtitleIn) * 20}px)`,
            position: hasBullets ? "absolute" : "relative",
          }}
        >
          {subtitle}
        </p>

        {/* Bullets — pop in from below, centered */}
        {hasBullets && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              width: "100%",
              maxWidth: 880,
            }}
          >
            {bullets.slice(0, 3).map((bullet, i) => {
              const bIn = bulletIns[i];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    opacity: bIn,
                    transform: `translateY(${(1 - bIn) * 30}px) scale(${0.9 + bIn * 0.1})`,
                  }}
                >
                  {/* Numbered pill */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: `3px solid ${accent}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 900,
                      color: accent,
                      flexShrink: 0,
                      boxShadow: `0 0 14px ${accent}66`,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.25,
                      textAlign: "left",
                    }}
                  >
                    {bullet}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Number badge bottom-right */}
        {frame >= 55 && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              right: 80,
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: `4px solid ${accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              color: accent,
              opacity: numBadgeIn,
              transform: `scale(${0.6 + numBadgeIn * 0.4})`,
              boxShadow: `0 0 24px ${accent}55`,
            }}
          >
            {number}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
