import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

export const Intro: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconIn = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 22, fps, config: { damping: 16 } });
  const badgeIn = spring({ frame: frame - 40, fps, config: { damping: 14 } });

  const iconFloat = Math.sin(frame * 0.07) * 12;
  const badgePulse = 1 + Math.sin(frame * 0.35) * 0.04;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div
            style={{
              opacity: iconIn,
              transform: `scale(${0.5 + iconIn * 0.5}) translateY(${iconFloat}px)`,
              filter: `drop-shadow(0 0 40px ${ACCENT}99)`,
              fontSize: 200,
              lineHeight: 1,
            }}
          >
            🖥️
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
              style={{ fontSize: 96 }}
            >
              VS Code
            </p>
            <p
              className="font-black text-center"
              style={{ color: ACCENT, fontSize: 56 }}
            >
              Shortcuts
            </p>
            <p
              className="font-bold text-zinc-400 text-center"
              style={{ fontSize: 34 }}
              hidden={subtitleIn < 0.1}
            >
              yang wajib kamu tahu
            </p>
          </div>

          {frame >= 40 && (
            <div
              className="rounded-3xl px-14 py-6"
              style={{
                background: ACCENT,
                boxShadow: `0 10px 40px ${ACCENT}99`,
                opacity: badgeIn,
                transform: `scale(${0.7 + badgeIn * 0.3}) scale(${badgePulse})`,
              }}
            >
              <span
                className="font-black text-white"
                style={{ fontSize: 52 }}
              >
                5 SHORTCUTS →
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
