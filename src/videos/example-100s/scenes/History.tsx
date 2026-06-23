import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const ADOPTERS = [
  { name: "Linux", emoji: "🐧" },
  { name: "Open Source", emoji: "🌐" },
  { name: "Teams", emoji: "👥" },
  { name: "Every Dev", emoji: "💻" },
];

export const History: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const yearIn = spring({ frame, fps, config: { damping: 14 } });
  const creatorIn = spring({ frame: frame - 30, fps, config: { damping: 16 } });
  const usersTitleIn = spring({
    frame: frame - 160,
    fps,
    config: { damping: 16 },
  });

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <p
            className="font-black tracking-tighter"
            style={{
              fontSize: 220,
              color: ACCENT,
              opacity: yearIn,
              transform: `scale(${0.7 + yearIn * 0.3})`,
              lineHeight: 1,
            }}
          >
            2005
          </p>
          <div
            className="flex flex-col items-center gap-2"
            style={{
              opacity: creatorIn,
              transform: `translateY(${(1 - creatorIn) * 30}px)`,
            }}
          >
            <p className="font-black text-white" style={{ fontSize: 64 }}>
              Linus Torvalds
            </p>
            <p className="text-3xl font-bold text-zinc-400">
              the world&apos;s version-control standard
            </p>
          </div>
          {frame >= 160 && (
            <div
              className="flex flex-col items-center gap-4"
              style={{
                opacity: usersTitleIn,
                transform: `translateY(${(1 - usersTitleIn) * 20}px)`,
              }}
            >
              <p className="text-3xl font-black uppercase tracking-wider text-zinc-400">
                used by everyone
              </p>
              <div className="flex gap-3">
                {ADOPTERS.map((u, i) => {
                  const userIn = spring({
                    frame: frame - 180 - i * 12,
                    fps,
                    config: { damping: 14 },
                  });
                  return (
                    <div
                      key={u.name}
                      className="flex flex-col items-center gap-1 rounded-2xl border-2 px-5 py-3"
                      style={{
                        borderColor: `${ACCENT}80`,
                        background: `${ACCENT}1a`,
                        opacity: userIn,
                        transform: `scale(${0.7 + userIn * 0.3})`,
                      }}
                    >
                      <span className="text-5xl">{u.emoji}</span>
                      <p
                        className="font-mono text-base font-bold uppercase"
                        style={{ color: "#c7d2fe" }}
                      >
                        {u.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
