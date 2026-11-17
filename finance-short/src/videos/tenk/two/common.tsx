// One scene per 2D beat. Each scene is a function of the beat context (frame in the beat, word cues).
import React from "react";
import {
  Ctx, PALS, Pal, Bg, Char, Fx, T, Box, Ico, Chart, Flag, Shadow, Pt, pop, fade, slide, ease, out3, clamp, lerp, count, fmt, hh,
  INK, NAVY, TEAL, GOLD, RED, GREEN, CREAM, W, H,
} from "./kit";
import { HERO, BANKER, townsfolk, fxCoin, fxBag, fxStack, fxStamp, fxQuestion, fxCash, fxHouse, fxWarning, fxBill, fxBurst } from "../toon";

export type Scene = (c: Ctx) => React.ReactNode;
const CH: Record<string, string> = { s1: "STEP 1 · DO NOTHING", s2: "STEP 2 · THREE CHECKS", s3: "STEP 3 · FREE MONEY", s4: "STEP 4 · THE WHOLE MARKET", s5: "STEP 5 · FEED IT", s6: "STEP 6 · DO NOT SELL", order: "THE ORDER" };
/** chapter chip, top left */
export const Chip: React.FC<{ ch: string; f: number }> = ({ ch, f }) => {
  const p = PALS[ch];
  if (!CH[ch]) return null;
  return <div style={{ position: "absolute", left: 56, top: 44, padding: "12px 24px", borderRadius: 40, background: p.dark ? "rgba(255,255,255,0.10)" : "rgba(36,23,38,0.08)",
    fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: 2.5, color: p.ink, opacity: 0.78 * fade(f, 0, 10) }}>{CH[ch]}</div>;
};
export const FLOOR = 880;
/** headline at the top of a scene */
export const Head: React.FC<{ c: Ctx; p: Pal; a?: number; y?: number; size?: number; x?: number; children: React.ReactNode }> = ({ c, p, a = 2, y = 190, size = 84, x = 960, children }) =>
  <T x={x} y={y + 30 * (1 - slide(c.f, a))} size={size} color={p.ink} op={fade(c.f, a, 8)} w={1700}>{children}</T>;
export const Em: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c }}>{children}</span>;

// ---------------- shared pieces ----------------
/** chapter title card */
export const Title = (pal: Pal, num: string, title: string, sub: string, who: (c: Ctx) => React.ReactNode): Scene => (c) => (
  <>
    <Bg p={pal} f={c.f} />
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1920 * 0.6 * out3(c.f / 14), background: pal.dark ? "rgba(255,255,255,0.05)" : "rgba(36,23,38,0.06)" }} />
    {num && <T x={250} y={520} size={520} color={pal.acc} op={fade(c.f, 0, 6)} s={0.6 + 0.4 * pop(c.f, 0, 12)}>{num}</T>}
    <T x={num ? 470 : 170} y={470 + 40 * (1 - slide(c.f, 4))} a="l" size={title.length > 14 ? 96 : 124} color={pal.ink} op={fade(c.f, 4, 8)} ls={-2}>{title}</T>
    <div style={{ position: "absolute", left: num ? 476 : 176, top: 566, height: 10, width: 560 * out3((c.f - 10) / 16), background: pal.acc2, borderRadius: 5 }} />
    <T x={num ? 474 : 174} y={640} a="l" size={58} wt={800} color={pal.ink} op={0.85 * fade(c.f, 14, 8)} ls={0}>{sub}</T>
    {who(c)}
  </>
);
/** a speech bubble with text, tail at the bottom */
export const Bubble: React.FC<{ x: number; y: number; s: number; w?: number; size?: number; bg?: string; color?: string; children: React.ReactNode }> = ({ x, y, s, w = 300, size = 44, bg = "#fff", color = INK, children }) => (s <= 0 ? null : (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 60, width: w, transform: `scale(${s})`, transformOrigin: "50% 130%" }}>
    <div style={{ background: bg, border: `6px solid ${INK}`, borderRadius: 30, padding: "16px 10px", textAlign: "center", fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 900, fontSize: size, lineHeight: 1.05, color }}>{children}</div>
    <div style={{ position: "absolute", left: w / 2 - 16, bottom: -20, width: 32, height: 32, background: bg, borderRight: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`, transform: "rotate(45deg)" }} />
  </div>
));
