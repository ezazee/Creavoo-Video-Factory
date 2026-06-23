import { interpolate, spring } from "remotion";

export type VisualData =
  | { type: "stat"; number: string; label: string }
  | { type: "checklist"; items: string[] }
  | { type: "bullets"; items: string[] }
  | { type: "quote"; text: string; source?: string }
  | { type: "code"; lines: string[] }
  | { type: "comparison"; left: string; right: string; leftLabel?: string; rightLabel?: string };

type Props = {
  visual: VisualData;
  frame: number;
  fps: number;
  startFrame: number;
  accent: string;
};

export const VisualBlock: React.FC<Props> = ({ visual, frame, fps, startFrame, accent }) => {
  const f = frame - startFrame;

  if (visual.type === "stat") {
    const numIn = spring({ frame: f, fps, config: { damping: 10, stiffness: 80, mass: 1.2 } });
    const labelIn = spring({ frame: f - 12, fps, config: { damping: 14 } });
    const glowPulse = 1 + Math.sin(frame * 0.15) * 0.08;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            opacity: numIn,
            transform: `scale(${0.4 + numIn * 0.6}) scale(${glowPulse})`,
            filter: `drop-shadow(0 0 40px ${accent}66)`,
            letterSpacing: "-4px",
          }}
        >
          {visual.number}
        </div>
        <p
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#18181b",
            textAlign: "center",
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * 20}px)`,
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          {visual.label}
        </p>
      </div>
    );
  }

  if (visual.type === "checklist") {
    const items = visual.items.slice(0, 3);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {items.map((item, i) => {
          const delay = i * Math.floor(fps * 0.55);
          const itemIn = spring({ frame: f - delay, fps, config: { damping: 14, stiffness: 110 } });
          const checkIn = spring({ frame: f - delay - 10, fps, config: { damping: 12, stiffness: 150 } });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: itemIn,
                transform: `translateX(${(1 - itemIn) * -40}px)`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: interpolate(checkIn, [0, 1], [0, 1]) > 0.5 ? accent : "transparent",
                  border: `3px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 28,
                  color: "white",
                  fontWeight: 900,
                  boxShadow: `0 0 16px ${accent}44`,
                  opacity: itemIn,
                }}
              >
                {checkIn > 0.5 ? "✓" : ""}
              </div>
              <p style={{ fontSize: 40, fontWeight: 700, color: "#18181b", lineHeight: 1.25 }}>
                {item}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  if (visual.type === "bullets") {
    const items = visual.items.slice(0, 3);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
        {items.map((item, i) => {
          const delay = i * Math.floor(fps * 0.55);
          const itemIn = spring({ frame: f - delay, fps, config: { damping: 14, stiffness: 110 } });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                opacity: itemIn,
                transform: `translateX(${(1 - itemIn) * -40}px)`,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: accent,
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${accent}88`,
                }}
              />
              <p style={{ fontSize: 40, fontWeight: 700, color: "#18181b", lineHeight: 1.25 }}>
                {item}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  if (visual.type === "quote") {
    const cardIn = spring({ frame: f, fps, config: { damping: 14, stiffness: 80 } });
    const textIn = spring({ frame: f - 8, fps, config: { damping: 16 } });
    const sourceIn = spring({ frame: f - 20, fps, config: { damping: 16 } });

    return (
      <div
        style={{
          width: "100%",
          borderRadius: 24,
          padding: "40px 48px",
          background: `${accent}14`,
          border: `2px solid ${accent}33`,
          opacity: cardIn,
          transform: `scale(${0.92 + cardIn * 0.08})`,
        }}
      >
        <div
          style={{
            fontSize: 100,
            lineHeight: 0.6,
            color: accent,
            fontFamily: "Georgia, serif",
            marginBottom: 20,
            opacity: 0.6,
          }}
        >
          "
        </div>
        <p
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#18181b",
            lineHeight: 1.4,
            fontStyle: "italic",
            opacity: textIn,
            transform: `translateY(${(1 - textIn) * 16}px)`,
          }}
        >
          {visual.text}
        </p>
        {visual.source && (
          <p
            style={{
              fontSize: 32,
              color: accent,
              marginTop: 24,
              fontWeight: 600,
              opacity: sourceIn,
            }}
          >
            — {visual.source}
          </p>
        )}
      </div>
    );
  }

  if (visual.type === "code") {
    const lines = visual.lines.slice(0, 4);
    const cardIn = spring({ frame: f, fps, config: { damping: 16 } });

    return (
      <div
        style={{
          width: "100%",
          borderRadius: 20,
          overflow: "hidden",
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 24}px)`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.15)`,
          border: "1px solid #e4e4e7",
        }}
      >
        {/* Terminal chrome — stays dark intentionally */}
        <div
          style={{
            background: "#1e1e1e",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid #333",
          }}
        >
          {["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ marginLeft: 12, fontSize: 26, color: "#888", fontFamily: "monospace" }}>
            code
          </span>
        </div>
        {/* Code lines */}
        <div style={{ background: "#f8f8f8", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map((line, i) => {
            const delay = i * Math.floor(fps * 0.4);
            const lineIn = spring({ frame: f - delay, fps, config: { damping: 16 } });
            const isComment = line.trim().startsWith("//") || line.trim().startsWith("#");
            const isKeyword = /^(const|let|var|function|return|import|export|if|for)\b/.test(line.trim());
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  opacity: lineIn,
                  transform: `translateX(${(1 - lineIn) * -20}px)`,
                }}
              >
                <span style={{ color: "#aaa", fontSize: 28, fontFamily: "monospace", minWidth: 32 }}>
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 34,
                    fontFamily: "monospace",
                    color: isComment ? "#4a7c59" : isKeyword ? "#0070c1" : "#333333",
                    lineHeight: 1.4,
                  }}
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (visual.type === "comparison") {
    const leftIn = spring({ frame: f, fps, config: { damping: 14, stiffness: 100 } });
    const rightIn = spring({ frame: f - Math.floor(fps * 0.6), fps, config: { damping: 14, stiffness: 100 } });

    return (
      <div style={{ display: "flex", gap: 20, width: "100%" }}>
        {/* Left — "before" / pemula */}
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            padding: "32px 28px",
            background: "#fef2f2",
            border: "2px solid #fca5a5",
            opacity: leftIn,
            transform: `translateX(${(1 - leftIn) * -30}px)`,
          }}
        >
          <p style={{ fontSize: 28, fontWeight: 800, color: "#ef4444", marginBottom: 16 }}>
            {visual.leftLabel ?? "❌ Pemula"}
          </p>
          <p style={{ fontSize: 36, fontWeight: 600, color: "#18181b", lineHeight: 1.35 }}>
            {visual.left}
          </p>
        </div>

        {/* Right — "after" / pro */}
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            padding: "32px 28px",
            background: `${accent}14`,
            border: `2px solid ${accent}44`,
            opacity: rightIn,
            transform: `translateX(${(1 - rightIn) * 30}px)`,
          }}
        >
          <p style={{ fontSize: 28, fontWeight: 800, color: accent, marginBottom: 16 }}>
            {visual.rightLabel ?? "✅ Pro"}
          </p>
          <p style={{ fontSize: 36, fontWeight: 600, color: "#18181b", lineHeight: 1.35 }}>
            {visual.right}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
