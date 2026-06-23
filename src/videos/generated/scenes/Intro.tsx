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
  videoTitle: string;
  subtitle: string;
  emoji: string;
  accent: string;
};

export const Intro: React.FC<Props> = ({ duration, videoTitle, subtitle, emoji, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emojiIn = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 12, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 24, fps, config: { damping: 16 } });
  const badgeIn = spring({ frame: frame - 50, fps, config: { damping: 14 } });

  const emojiFloat = Math.sin(frame * 0.07) * 12;
  const badgePulse = 1 + Math.sin(frame * 0.35) * 0.04;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-12">
          <div
            style={{
              fontSize: 180,
              lineHeight: 1,
              opacity: emojiIn,
              transform: `scale(${0.5 + emojiIn * 0.5}) translateY(${emojiFloat}px)`,
              filter: `drop-shadow(0 0 40px ${accent}99)`,
            }}
          >
            {emoji}
          </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 30}px)`,
            }}
          >
            <p
              className="font-black tracking-tight text-white text-center"
              style={{ fontSize: 80, lineHeight: 1.1 }}
            >
              {videoTitle}
            </p>
            {subtitle && (
              <p
                className="font-bold text-zinc-400 text-center"
                style={{ fontSize: 34, opacity: subtitleIn, maxWidth: 860 }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {frame >= 50 && (
            <div
              className="rounded-3xl px-14 py-6"
              style={{
                background: accent,
                boxShadow: `0 10px 40px ${accent}99`,
                opacity: badgeIn,
                transform: `scale(${0.7 + badgeIn * 0.3}) scale(${badgePulse})`,
              }}
            >
              <span className="font-black text-white" style={{ fontSize: 52 }}>
                Let's go →
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
