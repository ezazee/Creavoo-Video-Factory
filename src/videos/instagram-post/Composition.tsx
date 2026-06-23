import { AbsoluteFill, Img, staticFile } from "remotion";
import { Background } from "../../shared/Background";
import type { TipData } from "../generated/Composition";

export type InstagramPostProps = {
  videoTitle: string;
  subtitle: string;
  introEmoji: string;
  accent: string;
  tips: TipData[];
  ctaText: string;
  watermarkHandle?: string;
  watermarkLogo?: string;
};

export type InstagramCarouselSlideProps = InstagramPostProps & {
  slideIndex: number;   // 0 = cover, 1-5 = tips
  totalSlides: number;
};

// ── Shared watermark: logo top-left, handle bottom-right ──────────────────────
function ImageWatermark({ handle, logo }: { handle?: string; logo?: string }) {
  return (
    <>
      {logo && (
        <div style={{
          position: "absolute", top: 40, left: 40,
          background: "rgba(255,255,255,0.88)", borderRadius: 10,
          padding: "8px 12px", backdropFilter: "blur(4px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        }}>
          <Img src={staticFile(logo)} style={{ height: 36, width: "auto", maxWidth: 120, objectFit: "contain" }} />
        </div>
      )}
      {handle && (
        <div style={{
          position: "absolute", bottom: 40, right: 40,
          background: "rgba(255,255,255,0.88)", borderRadius: 24,
          padding: "8px 20px", backdropFilter: "blur(4px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#18181b", letterSpacing: "-0.5px" }}>
            {handle}
          </span>
        </div>
      )}
    </>
  );
}

// ── Slide counter top-right ────────────────────────────────────────────────────
function SlideCounter({ current, total, accent }: { current: number; total: number; accent: string }) {
  return (
    <div style={{
      position: "absolute", top: 40, right: 40,
      background: `${accent}dd`,
      borderRadius: 24,
      padding: "8px 20px",
      boxShadow: `0 4px 16px ${accent}55`,
    }}>
      <span style={{ fontSize: 30, fontWeight: 900, color: "white", letterSpacing: "1px" }}>
        {current}/{total}
      </span>
    </div>
  );
}

// ── Single post — semua tips dalam satu frame ─────────────────────────────────
export const InstagramPostComposition: React.FC<InstagramPostProps> = ({
  videoTitle, subtitle, introEmoji, accent, tips, ctaText,
  watermarkHandle = "", watermarkLogo,
}) => {
  const ac = accent || "#6366f1";
  return (
    <AbsoluteFill style={{ fontFamily: "sans-serif" }}>
      <Background accent={ac} />
      <AbsoluteFill style={{ padding: "60px 68px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 28 }}>
          <span style={{ fontSize: 76, lineHeight: 1, filter: `drop-shadow(0 0 20px ${ac}88)` }}>{introEmoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#18181b", lineHeight: 1.1, letterSpacing: "-1px" }}>
              {videoTitle}
            </p>
            {subtitle && (
              <p style={{ fontSize: 24, color: "#71717a", marginTop: 6, fontWeight: 600, lineHeight: 1.3 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {/* Divider */}
        <div style={{ height: 2, background: `${ac}33`, borderRadius: 2, marginBottom: 24 }} />
        {/* Tips */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {tips.slice(0, 5).map((tip, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 18,
              padding: "14px 20px", borderRadius: 16,
              background: "rgba(255,255,255,0.55)", border: `1.5px solid ${ac}22`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%", background: ac,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, color: "white", flexShrink: 0,
                boxShadow: `0 0 14px ${ac}55`,
              }}>{i + 1}</div>
              <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{tip.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#18181b", lineHeight: 1.2 }}>{tip.title}</p>
                <p style={{ fontSize: 21, color: "#71717a", marginTop: 3, lineHeight: 1.3 }}>{tip.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ marginTop: 22 }}>
          <div style={{
            background: ac, borderRadius: 16, padding: "14px 26px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 6px 24px ${ac}55`,
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{ctaText}</span>
          </div>
        </div>
      </AbsoluteFill>
      <ImageWatermark handle={watermarkHandle} logo={watermarkLogo} />
    </AbsoluteFill>
  );
};

// ── Carousel — satu slide per render ─────────────────────────────────────────
export const InstagramCarouselSlideComposition: React.FC<InstagramCarouselSlideProps> = ({
  videoTitle, subtitle, introEmoji, accent, tips, ctaText,
  watermarkHandle = "", watermarkLogo,
  slideIndex, totalSlides,
}) => {
  const ac = accent || "#6366f1";

  // Slide 0 = cover
  if (slideIndex === 0) {
    return (
      <AbsoluteFill style={{ fontFamily: "sans-serif" }}>
        <Background accent={ac} />
        <AbsoluteFill style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 80px 120px",
        }}>
          <span style={{
            fontSize: 180, lineHeight: 1, marginBottom: 40,
            filter: `drop-shadow(0 0 40px ${ac}88)`,
          }}>{introEmoji}</span>
          <p style={{
            fontSize: 72, fontWeight: 900, color: "#18181b",
            textAlign: "center", lineHeight: 1.1, letterSpacing: "-2px",
            marginBottom: 20,
          }}>{videoTitle}</p>
          {subtitle && (
            <p style={{
              fontSize: 34, color: "#71717a", textAlign: "center",
              fontWeight: 600, lineHeight: 1.4, maxWidth: 800,
              marginBottom: 48,
            }}>{subtitle}</p>
          )}
          <div style={{
            background: ac, borderRadius: 20, padding: "16px 48px",
            boxShadow: `0 8px 32px ${ac}55`,
          }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "white" }}>
              Swipe → {totalSlides - 1} tips
            </span>
          </div>
        </AbsoluteFill>
        <SlideCounter current={1} total={totalSlides} accent={ac} />
        <ImageWatermark handle={watermarkHandle} logo={watermarkLogo} />
      </AbsoluteFill>
    );
  }

  // Last slide = CTA outro
  if (slideIndex === totalSlides - 1) {
    return (
      <AbsoluteFill style={{ fontFamily: "sans-serif" }}>
        <Background accent={ac} />
        <AbsoluteFill style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px",
        }}>
          <span style={{ fontSize: 120, lineHeight: 1, marginBottom: 40 }}>💬</span>
          <p style={{
            fontSize: 64, fontWeight: 900, color: "#18181b",
            textAlign: "center", lineHeight: 1.2, letterSpacing: "-1.5px",
            marginBottom: 16,
          }}>{ctaText}</p>
          <p style={{ fontSize: 36, color: "#71717a", textAlign: "center", fontWeight: 600, marginBottom: 48 }}>
            Simpan & share ke temen kamu!
          </p>
          <div style={{
            display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center",
          }}>
            {["Save", "Share", "Follow"].map((label) => (
              <div key={label} style={{
                background: `${ac}18`, border: `2px solid ${ac}44`,
                borderRadius: 16, padding: "12px 32px",
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: ac }}>{label}</span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
        <SlideCounter current={totalSlides} total={totalSlides} accent={ac} />
        <ImageWatermark handle={watermarkHandle} logo={watermarkLogo} />
      </AbsoluteFill>
    );
  }

  // Tips slides (slideIndex 1 to totalSlides-2)
  const tipIndex = slideIndex - 1;
  const tip = tips[tipIndex];
  if (!tip) return null;

  return (
    <AbsoluteFill style={{ fontFamily: "sans-serif" }}>
      <Background accent={ac} />
      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 80px 100px",
      }}>
        {/* Number badge */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%", background: ac,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, fontWeight: 900, color: "white",
          boxShadow: `0 0 40px ${ac}66`, marginBottom: 32,
        }}>{tipIndex + 1}</div>

        {/* Emoji */}
        <span style={{
          fontSize: 140, lineHeight: 1, marginBottom: 32,
          filter: `drop-shadow(0 0 28px ${ac}66)`,
        }}>{tip.emoji}</span>

        {/* Title */}
        <p style={{
          fontSize: 68, fontWeight: 900, color: "#18181b",
          textAlign: "center", lineHeight: 1.15, letterSpacing: "-1.5px",
          marginBottom: 20,
        }}>{tip.title}</p>

        {/* Subtitle */}
        <p style={{
          fontSize: 36, color: "#71717a", textAlign: "center",
          fontWeight: 600, lineHeight: 1.4, maxWidth: 800,
          marginBottom: 40,
        }}>{tip.subtitle}</p>

        {/* Accent bar */}
        <div style={{
          height: 6, width: 120, borderRadius: 3,
          background: ac, boxShadow: `0 0 20px ${ac}88`,
        }} />
      </AbsoluteFill>
      <SlideCounter current={slideIndex + 1} total={totalSlides} accent={ac} />
      <ImageWatermark handle={watermarkHandle} logo={watermarkLogo} />
    </AbsoluteFill>
  );
};
