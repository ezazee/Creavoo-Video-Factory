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

  const logoIn = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 12, fps, config: { damping: 16 } });
  const goIn = spring({ frame: frame - 60, fps, config: { damping: 18 } });

  const logoFloat = Math.sin(frame * 0.08) * 14;
  const countdownNum = Math.max(95, 100 - Math.floor((frame - 30) / 4));
  const badgePulse = 1 + Math.sin(frame * 0.4) * 0.05;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {frame >= 30 && (
        <div
          className="absolute right-12 top-12 rounded-2xl border-2 px-6 py-3"
          style={{
            borderColor: `${ACCENT}80`,
            background: `${ACCENT}33`,
            transform: `scale(${badgePulse})`,
          }}
        >
          <p className="font-mono text-5xl font-black" style={{ color: "#c7d2fe" }}>
            {countdownNum}
          </p>
        </div>
      )}

      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div
            style={{
              opacity: logoIn,
              transform: `scale(${0.5 + logoIn * 0.5}) translateY(${logoFloat}px)`,
              filter: `drop-shadow(0 0 40px ${ACCENT}99)`,
              fontSize: 240,
              lineHeight: 1,
            }}
          >
            🌳
          </div>
          <div
            className="flex flex-col items-center gap-2"
            style={{
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 30}px)`,
            }}
          >
            <p
              className="font-black tracking-tight text-white"
              style={{ fontSize: 128 }}
            >
              Git
            </p>
            <p className="font-bold text-zinc-400" style={{ fontSize: 34 }}>
              A time machine for your code
            </p>
            <p
              className="font-bold uppercase tracking-wider"
              style={{ color: ACCENT, fontSize: 44 }}
            >
              in 100 seconds
            </p>
          </div>
          {frame >= 60 && (
            <div
              className="flex items-center gap-3 rounded-2xl px-12 py-6"
              style={{
                background: ACCENT,
                boxShadow: `0 10px 40px ${ACCENT}99`,
                opacity: goIn,
                transform: `scale(${0.7 + goIn * 0.3})`,
              }}
            >
              <span
                className="font-black uppercase text-white"
                style={{ fontSize: 56 }}
              >
                GO!
              </span>
              <span className="text-5xl text-white">→</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
