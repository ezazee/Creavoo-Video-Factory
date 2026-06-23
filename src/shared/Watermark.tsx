import { AbsoluteFill, Img, staticFile } from "remotion";

/**
 * Channel handle watermark. Set your handle via the `handle` prop.
 * Optional: drop an avatar image in `public/` and pass its filename via
 * `avatarFile` (e.g. "avatar.png"). No avatar is bundled by default.
 */
export const Watermark: React.FC<{
  handle?: string;
  avatarFile?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}> = ({ handle = "", avatarFile, position = "top-right" }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-right": {
      alignItems: "flex-end",
      justifyContent: "flex-end",
      padding: "0 40px 60px 0",
    },
    "bottom-left": {
      alignItems: "flex-end",
      justifyContent: "flex-start",
      padding: "0 0 60px 40px",
    },
    "top-right": {
      alignItems: "flex-start",
      justifyContent: "flex-end",
      padding: "60px 40px 0 0",
    },
    "top-left": {
      alignItems: "flex-start",
      justifyContent: "flex-start",
      padding: "60px 0 0 40px",
    },
  };

  if (!handle && !avatarFile) return null;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "row",
        ...positionStyles[position],
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-3 rounded-full border border-white/15 bg-black/55 px-5 py-2.5 backdrop-blur-md"
        style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.3)" }}
      >
        {avatarFile && (
          <Img
            src={staticFile(avatarFile)}
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        {handle && (
          <span className="font-mono text-3xl font-bold tracking-tight text-white">
            {handle}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
