// The big on-screen lines of each scene (top third), slammed in with a pop; key words in yellow. Plus the
// "fictional story" tag at the start and the end: this film is not a real event.
import React from "react";
import { AbsoluteFill, spring } from "remotion";

const FONT = "'Inter Display', Inter, sans-serif";
type Line = { a: number; b: number; text: string; hi: string[] };
export const LINES: Line[] = [
  { a: 4, b: 165, text: "$100,000,000… GONE?", hi: ["GONE?"] },
  { a: 214, b: 410, text: "HE HAD EVERYTHING.", hi: ["EVERYTHING."] },
  { a: 425, b: 560, text: "ONE PHONE CALL.", hi: ["PHONE", "CALL."] },
  { a: 660, b: 748, text: "YOUR INVESTMENT HAS COLLAPSED.", hi: ["COLLAPSED."] },
  { a: 749, b: 915, text: "MILLIONS LOST.", hi: ["LOST."] },
  { a: 920, b: 1070, text: "FROM MILLIONS TO NOTHING.", hi: ["NOTHING."] },
  { a: 1174, b: 1305, text: "NEVER THINK YOU'RE UNTOUCHABLE.", hi: ["UNTOUCHABLE."] },
  { a: 1463, b: 1710, text: "WHAT WOULD YOU DO?", hi: ["YOU", "DO?"] },
];

export const SceneText: React.FC<{ f: number }> = ({ f }) => {
  const l = LINES.find((x) => f >= x.a && f < x.b);
  const tag = f < 75 || f >= 1640;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {l && (() => {
        const k = spring({ frame: f - l.a, fps: 30, config: { damping: 11, stiffness: 220 } }), out = Math.min(1, Math.max(0, (l.b - f) / 6));
        return (
          <div style={{ position: "absolute", top: 230, left: 50, right: 50, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: l.text.length > 22 ? 84 : 104,
            lineHeight: 1.05, color: "#ffffff", WebkitTextStroke: "18px #0b0b10", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,0.5)",
            transform: `scale(${1.6 - 0.6 * k})`, opacity: Math.min(k * 2, out) }}>
            {l.text.split(" ").map((w, i) => <span key={i} style={{ color: l.hi.includes(w) ? "#ffd23f" : "#ffffff" }}>{w} </span>)}
          </div>
        );
      })()}
      {tag && <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: "0.12em", color: "#ffffff", opacity: 0.85 }}>A FICTIONAL STORY</div>}
    </AbsoluteFill>
  );
};
