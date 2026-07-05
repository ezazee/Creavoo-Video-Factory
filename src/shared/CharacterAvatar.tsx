import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type Expression =
  | "ramah"
  | "semangat"
  | "mikir"
  | "kaget"
  | "facepalm"
  | "awkward"
  | "peace";

// Bagi durasi scene rata ke tiap ekspresi dalam array — satu ekspresi per
// kalimat narasi, ganti otomatis di tengah scene mengikuti apa yang diucapkan.
export function pickExpressionAtFrame(
  expressions: Expression[] | undefined,
  frame: number,
  duration: number
): Expression | undefined {
  if (!expressions || expressions.length === 0) return undefined;
  const segment = duration / expressions.length;
  const idx = Math.min(expressions.length - 1, Math.floor(frame / segment));
  return expressions[idx];
}

/**
 * Karakter chibi personal Zaportfolio — ganti ekspresi mengikuti kalimat yang
 * lagi diucapkan dalam satu scene.
 *
 * variant="overlay" (default): absolute, tengah-bawah layar — dipakai di
 * intro/tip scenes.
 * variant="inline": bagian dari flex layout normal (dipakai di Outro, di
 * atas blok Recap, bukan floating overlay).
 */
export const CharacterAvatar: React.FC<{
  expression: Expression;
  size?: number;
  variant?: "overlay" | "inline";
}> = ({ expression, size = 260, variant = "overlay" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const in_ = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const bob = Math.sin(frame * 0.09) * 5;

  const bubble = (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "#ffffff",
        border: "5px solid #1a3358",
        boxShadow: "0 12px 36px rgba(26,51,88,0.4)",
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
  );

  if (variant === "inline") {
    return (
      <div
        style={{
          width: size,
          height: size,
          opacity: in_,
          transform: `scale(${0.7 + in_ * 0.3}) translateY(${bob}px)`,
        }}
      >
        {bubble}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: "50%",
        width: size,
        height: size,
        opacity: in_,
        transform: `translateX(-50%) scale(${0.7 + in_ * 0.3}) translateY(${bob}px)`,
      }}
    >
      {bubble}
    </div>
  );
};
