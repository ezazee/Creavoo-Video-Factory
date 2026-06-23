import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const Key: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="rounded-2xl border-2 font-mono font-black text-white flex items-center justify-center"
    style={{
      borderColor: ACCENT,
      background: `${ACCENT}2a`,
      fontSize: 60,
      minWidth: 120,
      padding: "20px 32px",
      boxShadow: `0 6px 0 ${ACCENT}66, 0 8px 20px ${ACCENT}44`,
    }}
  >
    {label}
  </div>
);

export const Shortcut1: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const keysIn = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.8 } });
  const descIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });
  const tipIn = spring({ frame: frame - 90, fps, config: { damping: 16 } });

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-10">
          <div
            className="rounded-full flex items-center justify-center font-black"
            style={{
              width: 110,
              height: 110,
              background: ACCENT,
              fontSize: 64,
              color: "white",
              opacity: numIn,
              transform: `scale(${0.5 + numIn * 0.5})`,
              boxShadow: `0 0 40px ${ACCENT}88`,
            }}
          >
            1
          </div>

          <div
            className="flex items-center gap-5"
            style={{
              opacity: keysIn,
              transform: `scale(${0.8 + keysIn * 0.2})`,
            }}
          >
            <Key label="Ctrl" />
            <span className="font-black text-zinc-400" style={{ fontSize: 60 }}>+</span>
            <Key label="P" />
          </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: descIn,
              transform: `translateY(${(1 - descIn) * 20}px)`,
            }}
          >
            <p className="font-black text-white text-center" style={{ fontSize: 64 }}>
              Quick Open
            </p>
            <p className="font-bold text-zinc-400 text-center" style={{ fontSize: 34, maxWidth: 800 }}>
              Cari file apapun dengan fuzzy search
            </p>
          </div>

          {frame >= 90 && (
            <div
              className="flex items-center gap-4 rounded-2xl px-10 py-5"
              style={{
                background: `${ACCENT}20`,
                border: `2px solid ${ACCENT}60`,
                opacity: tipIn,
                transform: `translateY(${(1 - tipIn) * 15}px)`,
              }}
            >
              <span style={{ fontSize: 36 }}>💡</span>
              <span className="font-bold text-zinc-300 text-center" style={{ fontSize: 30 }}>
                Ketik bagian nama file — langsung lompat!
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
