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

export const TipScene: React.FC<Props> = ({
  duration,
  number,
  title,
  subtitle,
  emoji,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.8 } });
  const titleIn = spring({ frame: frame - 25, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });

  const emojiFloat = Math.sin(frame * 0.08) * 10;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-10 px-12">
          <div
            className="rounded-full flex items-center justify-center font-black"
            style={{
              width: 110,
              height: 110,
              background: accent,
              fontSize: 64,
              color: "white",
              opacity: numIn,
              transform: `scale(${0.5 + numIn * 0.5})`,
              boxShadow: `0 0 40px ${accent}88`,
            }}
          >
            {number}
          </div>

          <div
            style={{
              fontSize: 160,
              lineHeight: 1,
              opacity: emojiIn,
              transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
              filter: `drop-shadow(0 0 30px ${accent}66)`,
            }}
          >
            {emoji}
          </div>

          <div
            className="flex flex-col items-center gap-4"
            style={{
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 24}px)`,
            }}
          >
            <p
              className="font-black text-white text-center"
              style={{ fontSize: 72, lineHeight: 1.1 }}
            >
              {title}
            </p>
            <p
              className="font-bold text-zinc-400 text-center"
              style={{
                fontSize: 36,
                maxWidth: 860,
                opacity: subtitleIn,
                transform: `translateY(${(1 - subtitleIn) * 16}px)`,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
