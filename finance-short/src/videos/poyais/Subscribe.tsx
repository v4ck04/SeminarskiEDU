// "Like & subscribe" pop-up near the end: slides in, a pointer taps the like button (turns blue) and then
// subscribe (turns grey, "SUBSCRIBED", bell), slides out. Frames A..E on the composition timeline.
import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";

export const SUB = { in: 1550, like: 1574, sub: 1596, out: 1636 };
const FONT = "'Inter Display', Inter, sans-serif";

const Thumb: React.FC<{ on: boolean }> = ({ on }) => (
  <svg width="74" height="74" viewBox="0 0 24 24"><path fill={on ? "#3ea6ff" : "#ffffff"}
    d="M2 21h4V9H2v12zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z" /></svg>
);
const Bell: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4a1.5 1.5 0 0 0-3 0v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
);
const Hand: React.FC = () => (
  <svg width="90" height="110" viewBox="0 0 24 30"><path fill="#ffffff" stroke="#141016" strokeWidth="1.3" strokeLinejoin="round"
    d="M9 2.5a1.8 1.8 0 0 1 3.6 0V11l.4-.1a1.8 1.8 0 0 1 2.2 1.3 1.8 1.8 0 0 1 2.6 1 1.8 1.8 0 0 1 2.7 1.4V20c0 4-3 7.5-7 7.5h-1c-2.5 0-4.4-1.3-5.6-3.4L3.2 18a1.8 1.8 0 0 1 3-2L9 19z" /></svg>
);

export const Subscribe: React.FC<{ f: number }> = ({ f }) => {
  if (f < SUB.in || f > SUB.out + 12) return null;
  const enter = spring({ frame: f - SUB.in, fps: 30, config: { damping: 14, stiffness: 170 } });
  const leave = interpolate(f, [SUB.out, SUB.out + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = (1 - enter) * -260 - leave * 260, liked = f >= SUB.like + 3, subbed = f >= SUB.sub + 3;
  const press = (g: number) => 1 - 0.12 * Math.max(0, 1 - Math.abs(f - g) / 4);
  // the pointer: comes in from the lower right to the like button, then to subscribe, then away
  const px = interpolate(f, [SUB.in + 6, SUB.like, SUB.like + 6, SUB.sub, SUB.sub + 10], [980, 260, 260, 760, 980], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const py = interpolate(f, [SUB.in + 6, SUB.like, SUB.like + 6, SUB.sub, SUB.sub + 10], [560, 360, 360, 360, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tap = (g: number) => (f >= g - 2 && f <= g + 3 ? 0.85 : 1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, top: 250 + y, width: 960, height: 190, borderRadius: 40, background: "rgba(20,16,22,0.92)",
        border: "5px solid #ffffff", display: "flex", alignItems: "center", padding: "0 30px", boxSizing: "border-box", gap: 24, fontFamily: FONT, boxShadow: "0 12px 0 rgba(0,0,0,0.35)" }}>
        <div style={{ width: 118, height: 118, borderRadius: 59, background: "#f2c94c", border: "5px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 70, fontWeight: 900, color: "#141016" }}>V</div>
        <div style={{ flex: 1, color: "#ffffff", fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>Vacko<br /><span style={{ fontSize: 30, fontWeight: 700, color: "#cfc6d6" }}>Money Stories</span></div>
        <div style={{ transform: `scale(${press(SUB.like)})`, display: "flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: 60,
          background: liked ? "rgba(62,166,255,0.18)" : "rgba(255,255,255,0.12)" }}><Thumb on={liked} /></div>
        <div style={{ transform: `scale(${press(SUB.sub)})`, display: "flex", alignItems: "center", gap: 10, height: 110, padding: "0 30px", borderRadius: 55,
          background: subbed ? "#4a4550" : "#e62117", color: "#ffffff", fontSize: 40, fontWeight: 900, letterSpacing: "0.02em" }}>
          {subbed ? <><Bell />SUBSCRIBED</> : "SUBSCRIBE"}
        </div>
      </div>
      {f < SUB.sub + 10 && f > SUB.in + 6 && (
        <div style={{ position: "absolute", left: px - 30, top: py + y * 0.2, transform: `scale(${tap(SUB.like) * tap(SUB.sub)})`, transformOrigin: "30% 5%" }}><Hand /></div>
      )}
    </AbsoluteFill>
  );
};
