import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CharacterAvatar } from "../../../shared/CharacterAvatar";
import { TipIcon } from "./TipMedia";

type Props = {
  duration: number;
  videoTitle: string;
  subtitle: string;
  emoji: string;
  accent: string;
  profile?: "creavoo" | "zaportfolio";
  iconFile?: string;
};

export const Intro: React.FC<Props> = ({ duration, videoTitle, subtitle, emoji, accent, profile = "creavoo", iconFile }) => {
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

  if (profile === "zaportfolio") {
    const navy = "#1a3358";
    return (
      <AbsoluteFill style={{ opacity: 1 - exit }}>
        <AbsoluteFill className="items-center justify-center">
          <div className="flex flex-col items-center gap-10 px-14">
            <CharacterAvatar expression="semangat" variant="inline" shape="circle" size={200} />

            {/* Tag pill */}
            <div
              style={{
                opacity: emojiIn,
                transform: `scale(${0.8 + emojiIn * 0.2})`,
              }}
            >
              <div
                className="flex items-center gap-4 px-10 py-4 rounded-2xl"
                style={{ background: `${navy}12`, border: `2px solid ${navy}25` }}
              >
                <TipIcon emoji={emoji} iconFile={iconFile} size={44} accent={navy} />
                <div
                  style={{
                    width: 3,
                    height: 52,
                    background: navy,
                    borderRadius: 2,
                    opacity: 0.2,
                  }}
                />
                <span
                  className="font-black uppercase tracking-widest"
                  style={{ fontSize: 28, color: navy, letterSpacing: "0.15em" }}
                >
                  Zaportfolio
                </span>
              </div>
            </div>

            {/* Title */}
            <div
              className="flex flex-col items-center gap-4"
              style={{
                opacity: titleIn,
                transform: `translateY(${(1 - titleIn) * 30}px)`,
              }}
            >
              <p
                className="font-black tracking-tight text-center"
                style={{ fontSize: 82, lineHeight: 1.05, color: navy }}
              >
                {videoTitle}
              </p>
              {subtitle && (
                <p
                  className="font-semibold text-center"
                  style={{ fontSize: 34, opacity: subtitleIn, maxWidth: 860, color: `${navy}99` }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* CTA badge — navy solid */}
            {frame >= 50 && (
              <div
                className="rounded-2xl px-14 py-5"
                style={{
                  background: navy,
                  boxShadow: `0 12px 40px ${navy}40`,
                  opacity: badgeIn,
                  transform: `scale(${0.7 + badgeIn * 0.3}) scale(${badgePulse})`,
                }}
              >
                <span className="font-black text-white" style={{ fontSize: 48 }}>
                  Let's go →
                </span>
              </div>
            )}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-12">
          <div
            style={{
              opacity: emojiIn,
              transform: `scale(${0.5 + emojiIn * 0.5}) translateY(${emojiFloat}px)`,
            }}
          >
            <TipIcon emoji={emoji} iconFile={iconFile} size={150} accent={accent} style={{ fontSize: 180 }} />
          </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 30}px)`,
            }}
          >
            <p
              className="font-black tracking-tight text-zinc-900 text-center"
              style={{ fontSize: 80, lineHeight: 1.1 }}
            >
              {videoTitle}
            </p>
            {subtitle && (
              <p
                className="font-bold text-zinc-500 text-center"
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
