import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type Expression =
  | "ramah"
  | "semangat"
  | "mikir"
  | "kaget"
  | "facepalm"
  | "awkward"
  | "peace";

/**
 * Karakter chibi personal Zaportfolio — muncul sebagai "reaction bubble" di
 * pojok kiri-bawah, konsisten di semua scene, ganti ekspresi sesuai konten.
 */
export const CharacterAvatar: React.FC<{
  expression: Expression;
  size?: number;
}> = ({ expression, size = 168 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const in_ = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const bob = Math.sin(frame * 0.09) * 5;

  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        bottom: 24,
        width: size,
        height: size,
        opacity: in_,
        transform: `scale(${0.7 + in_ * 0.3}) translateY(${bob}px)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "#ffffff",
          border: "4px solid #1a3358",
          boxShadow: "0 8px 24px rgba(26,51,88,0.35)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(`characters/zaportfolio/${expression}.png`)}
          style={{ width: "112%", height: "112%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
};
