// 2D explainer kit for the long video: flat illustrated scenes in the same hand as the 3D shots (the characters are
// drawn by the same toon.ts code onto <canvas>), plus text, counters, charts and ink-outlined SVG icons.
// Everything is positioned in 1920 x 1080 px; time is in frames (30 fps) local to the beat.
import React, { useLayoutEffect, useRef } from "react";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, Prop } from "../toon";
import TIMING from "../timing.json";

export const W = 1920, H = 1080, FPS = 30;
export const INK = "#241726", NAVY = "#0B1E3A", TEAL = "#2BD9A8", GOLD = "#FFC94A", RED = "#FF5A4F", GREEN = "#34B36A", CREAM = "#FBF6E9";
export type Beat = { id: string; ch: string; mode: string; f0: number; f1: number; fe: number; title: string; text: string; words: [string, number][] };
export const BEATS = (TIMING as unknown as { beats: Beat[] }).beats;
export const TOTAL = (TIMING as unknown as { total: number }).total;
export const beatAt = (f: number) => BEATS.find((b) => f >= b.f0 && f < b.f1) ?? BEATS[BEATS.length - 1];
/** what a scene gets: f = frame inside the beat, n = beat length, nv = length of the speech, c(word) = frame of a word */
export type Ctx = { f: number; n: number; nv: number; beat: Beat; c: (word: string, nth?: number) => number };
export const ctxOf = (b: Beat, gf: number): Ctx => ({
  f: gf - b.f0, n: b.f1 - b.f0, nv: b.fe - b.f0, beat: b,
  c: (word, nth = 0) => { let k = 0; for (const [w, f] of b.words) if (w === word.toLowerCase() && k++ === nth) return f - b.f0; return 0; },
});

// ---------------- motion ----------------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (u: number) => { const x = clamp(u); return x * x * (3 - 2 * x); };
export const out3 = (u: number) => 1 - (1 - clamp(u)) ** 3;
/** 0 -> 1 with a small overshoot, starting at frame a */
export const pop = (f: number, a: number, d = 11) => { const u = (f - a) / d; if (u <= 0) return 0; if (u >= 1) return 1; const v = u - 1, s = 1.9; return 1 + v * v * ((s + 1) * v + s); };
export const fade = (f: number, a: number, d = 8) => clamp((f - a) / d);
export const slide = (f: number, a: number, d = 14) => out3((f - a) / d);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const fmt = (v: number) => Math.round(v).toLocaleString("en-US");

// ---------------- canvas drawings (characters, effects) ----------------
const Cv: React.FC<{ k: string; w: number; h: number; res: number; draw: (p: Pen) => void; style: React.CSSProperties }> = ({ k, w, h, res, draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null), last = useRef("");
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv || last.current === k) return;
    const g = cv.getContext("2d")!; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(res, 0, 0, res, 0, 0);
    draw(new Pen(g)); last.current = k;
  });
  return <canvas ref={ref} width={Math.round(w * res)} height={Math.round(h * res)} style={{ position: "absolute", ...style }} />;
};
const lid = (f: number, id: number) => { const cyc = 76 + ((id * 37) % 50), k = (f + id * 23) % cyc; return k < 4 ? [0.5, 1, 1, 0.5][k] : 0; };
export type CharP = { o: Outfit; ok: string; x: number; y: number; h: number; f: number; id?: number; expr?: Expr; mode?: FrontOpts["mode"]; prop?: Prop; look?: number;
  wave?: number; tilt?: number; headTilt?: number; flip?: boolean; sil?: string; s?: number; op?: number; still?: boolean };
/** a character standing with its soles at (x, y); h = height of the 1000-unit drawing in px */
export const Char: React.FC<CharP> = ({ o, ok, x, y, h, f, id = 1, expr = "neutral", mode = "stand", prop = null, look = 0, wave, tilt = 0, headTilt = 0, flip, sil, s = 1, op = 1, still }) => {
  if (s <= 0 || op <= 0) return null;
  const blink = lid(f, id), wv = wave === undefined ? undefined : Math.round(wave * 4) / 4;
  const opts: FrontOpts = { mode, expr, look, blink, prop, tilt, headTilt, wave: wv, seed: ((id * 5 + 3) % 7) + 1 };
  const bob = still ? 0 : 1.6 * Math.sin(f * 0.07 + id * 1.3), res = Math.max(0.3, (h / 1000) * 1.25);
  return <Cv k={ok + JSON.stringify(opts)} w={600} h={1000} res={res} draw={(p) => bodyFront(p, o, opts)}
    style={{ left: x - 0.3 * h, top: y - 0.975 * h + bob, width: 0.6 * h, height: h, opacity: op, transformOrigin: "50% 97.5%",
      transform: `scale(${(flip ? -1 : 1) * s}, ${s})`, filter: sil ? `brightness(0) drop-shadow(0 0 0 ${sil})` : undefined }} />;
};
/** an effect drawing (toon.ts fx*) centred at (x, y), w px wide */
export const Fx: React.FC<{ k: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; w: number; rot?: number; s?: number; op?: number }> = ({ k, cw, ch, draw, x, y, w, rot = 0, s = 1, op = 1 }) => {
  if (s <= 0 || op <= 0) return null;
  const hgt = (w * ch) / cw;
  return <Cv k={k} w={cw} h={ch} res={Math.max(0.5, (w / cw) * 1.25)} draw={draw}
    style={{ left: x - w / 2, top: y - hgt / 2, width: w, height: hgt, opacity: op, transform: `rotate(${rot}deg) scale(${s})` }} />;
};

// ---------------- text and boxes ----------------
export type TP = { x: number; y: number; size: number; color?: string; w?: number; a?: "c" | "l" | "r"; wt?: number; ls?: number; lh?: number; op?: number; s?: number; rot?: number;
  font?: string; shadow?: string; stroke?: string; sw?: number; children: React.ReactNode };
/** text anchored at (x, y): centre (default), left-middle or right-middle */
export const T: React.FC<TP> = ({ x, y, size, color = INK, w, a = "c", wt = 900, ls = -0.5, lh = 1.06, op = 1, s = 1, rot = 0, font, shadow, stroke, sw = 0, children }) => {
  if (op <= 0 || s <= 0) return null;
  const tx = a === "c" ? "-50%" : a === "l" ? "0%" : "-100%";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `translate(${tx}, -50%) rotate(${rot}deg) scale(${s})`, transformOrigin: a === "c" ? "50% 50%" : a === "l" ? "0% 50%" : "100% 50%",
      fontFamily: font ?? '"Inter Display", Inter, sans-serif', fontWeight: wt, fontSize: size, lineHeight: lh, letterSpacing: ls, color, opacity: op, whiteSpace: w ? "pre-line" : "pre",
      textAlign: a === "c" ? "center" : a === "l" ? "left" : "right", textShadow: shadow, WebkitTextStroke: stroke ? `${sw}px ${stroke}` : undefined, paintOrder: "stroke fill" }}>{children}</div>
  );
};
export const Box: React.FC<{ x: number; y: number; w: number; h: number; bg?: string; r?: number; bd?: string; bw?: number; op?: number; s?: number; rot?: number; shadow?: boolean; children?: React.ReactNode }> =
  ({ x, y, w, h, bg = "#fff", r = 24, bd = INK, bw = 6, op = 1, s = 1, rot = 0, shadow = true, children }) => (op <= 0 || s <= 0 ? null : (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, background: bg, borderRadius: r, border: bw ? `${bw}px solid ${bd}` : undefined, boxSizing: "border-box",
      opacity: op, transform: `rotate(${rot}deg) scale(${s})`, boxShadow: shadow ? `0 10px 0 rgba(36,23,38,0.18)` : undefined, overflow: "hidden" }}>{children}</div>
  ));
/** a number that counts from a to b between frames f0 and f1 */
export const count = (f: number, f0: number, f1: number, a: number, b: number) => lerp(a, b, out3((f - f0) / Math.max(1, f1 - f0)));

// ---------------- backgrounds ----------------
export type Pal = { bg: string; bg2: string; ink: string; acc: string; acc2: string; soft: string; dark?: boolean };
export const PALS: Record<string, Pal> = {
  hook: { bg: "#0B1E3A", bg2: "#132b50", ink: "#ffffff", acc: TEAL, acc2: GOLD, soft: "rgba(255,255,255,0.08)", dark: true },
  newton: { bg: "#F3E7C9", bg2: "#E9D9B2", ink: "#3A2A1C", acc: "#B5463C", acc2: "#2E8B4A", soft: "rgba(58,42,28,0.10)" },
  twain: { bg: "#F7ECDD", bg2: "#EFDCC4", ink: "#3B2A22", acc: "#B5653F", acc2: "#2F7F86", soft: "rgba(59,42,34,0.10)" },
  fisher: { bg: "#ECEBE6", bg2: "#DDDCD4", ink: "#1E2433", acc: "#C0392B", acc2: "#2B5FA8", soft: "rgba(30,36,51,0.09)" },
  ltcm: { bg: "#0F1A2E", bg2: "#16263F", ink: "#EAF2FF", acc: TEAL, acc2: GOLD, soft: "rgba(255,255,255,0.07)", dark: true },
  pattern: { bg: "#0B1E3A", bg2: "#132b50", ink: "#ffffff", acc: TEAL, acc2: GOLD, soft: "rgba(255,255,255,0.08)", dark: true },
  read: { bg: "#EEF3E2", bg2: "#DFE8CC", ink: "#26321F", acc: "#4D6B3C", acc2: "#C8862B", soft: "rgba(38,50,31,0.10)" },
};
export const Bg: React.FC<{ p: Pal; f: number; floor?: number }> = ({ p, f, floor }) => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 38%, ${p.bg} 0%, ${p.bg} 46%, ${p.bg2} 100%)`, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: -40, opacity: p.dark ? 0.5 : 0.55, backgroundImage: `radial-gradient(${p.soft} 2.2px, transparent 2.6px)`, backgroundSize: "34px 34px",
      transform: `translate(${(f * 0.12) % 34}px, ${(f * 0.07) % 34}px)` }} />
    {floor !== undefined && <div style={{ position: "absolute", left: 0, right: 0, top: floor, bottom: 0, background: p.soft, borderTop: `5px solid ${p.dark ? "rgba(255,255,255,0.14)" : "rgba(36,23,38,0.16)"}` }} />}
  </div>
);
/** soft contact shadow under a character */
export const Shadow: React.FC<{ x: number; y: number; w: number; op?: number }> = ({ x, y, w, op = 0.22 }) =>
  <div style={{ position: "absolute", left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: "50%", background: `rgba(20,14,24,${op})` }} />;

// ---------------- charts ----------------
export type Pt = [number, number];
/** value of a polyline at x */
export const yAt = (pts: Pt[], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return pts[pts.length - 1][1];
};
export type ChartP = { x: number; y: number; w: number; h: number; pts: Pt[]; x0: number; x1: number; y0: number; y1: number; upTo: number; color: string; ink: string; soft: string;
  xl?: [number, string][]; yl?: [number, string][]; lw?: number; fillTo?: boolean; color2?: string; split?: number; children?: (sx: (v: number) => number, sy: (v: number) => number) => React.ReactNode; op?: number };
/** a line chart drawn up to x = upTo (the line after `split` is drawn in color2) */
export const Chart: React.FC<ChartP> = ({ x, y, w, h, pts, x0, x1, y0, y1, upTo, color, ink, soft, xl = [], yl = [], lw = 10, color2, split, children, op = 1 }) => {
  const sx = (v: number) => ((v - x0) / (x1 - x0)) * w, sy = (v: number) => h - ((v - y0) / (y1 - y0)) * h;
  const seg = (a: number, b: number) => { const o: Pt[] = [[a, yAt(pts, a)]]; for (const p of pts) if (p[0] > a && p[0] < b) o.push(p); o.push([b, yAt(pts, b)]); return o.map(([px, py]) => `${sx(px).toFixed(1)},${sy(py).toFixed(1)}`).join(" "); };
  const end = Math.min(upTo, pts[pts.length - 1][0]), s0 = pts[0][0];
  return (
    <svg width={w + 200} height={h + 120} viewBox={`-100 -40 ${w + 200} ${h + 120}`} style={{ position: "absolute", left: x - 100, top: y - 40, opacity: op, overflow: "visible" }}>
      {yl.map(([v, t], i) => <g key={i}><line x1={0} x2={w} y1={sy(v)} y2={sy(v)} stroke={soft} strokeWidth={3} /><text x={-16} y={sy(v) + 10} textAnchor="end" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={30} fill={ink} opacity={0.7}>{t}</text></g>)}
      <line x1={0} x2={w} y1={h} y2={h} stroke={ink} strokeWidth={5} opacity={0.55} />
      {xl.map(([v, t], i) => <text key={i} x={sx(v)} y={h + 46} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={30} fill={ink} opacity={0.7}>{t}</text>)}
      {end > s0 && <polyline points={seg(s0, split !== undefined ? Math.min(end, split) : end)} fill="none" stroke={INK} strokeWidth={lw + 8} strokeLinejoin="round" strokeLinecap="round" />}
      {split !== undefined && end > split && <polyline points={seg(split, end)} fill="none" stroke={INK} strokeWidth={lw + 8} strokeLinejoin="round" strokeLinecap="round" />}
      {end > s0 && <polyline points={seg(s0, split !== undefined ? Math.min(end, split) : end)} fill="none" stroke={color} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />}
      {split !== undefined && end > split && <polyline points={seg(split, end)} fill="none" stroke={color2 ?? color} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />}
      {end > s0 && <circle cx={sx(end)} cy={sy(yAt(pts, end))} r={15} fill={split !== undefined && end > split ? color2 ?? color : color} stroke={INK} strokeWidth={6} />}
      {children?.(sx, sy)}
    </svg>
  );
};
/** a flag on a chart: a dot, a stem and a label box (use inside <Chart> children) */
export const Flag: React.FC<{ cx: number; cy: number; label: string; sub?: string; color: string; s: number; up?: boolean; dx?: number; len?: number }> = ({ cx, cy, label, sub, color, s, up = true, dx = 0, len = 70 }) => {
  if (s <= 0) return null;
  const y2 = cy + (up ? -len : len), wBox = Math.max(label.length, (sub ?? "").length * 0.62) * 25 + 44, hBox = sub ? 96 : 62;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <line x1={cx} y1={cy} x2={cx + dx} y2={y2} stroke={INK} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={13} fill={color} stroke={INK} strokeWidth={6} />
      <rect x={cx + dx - wBox / 2} y={up ? y2 - hBox : y2} width={wBox} height={hBox} rx={14} fill={color} stroke={INK} strokeWidth={6} />
      <text x={cx + dx} y={(up ? y2 - hBox : y2) + (sub ? 40 : 44)} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={900} fontSize={38} fill="#fff">{label}</text>
      {sub && <text x={cx + dx} y={(up ? y2 - hBox : y2) + 78} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={26} fill="#fff" opacity={0.92}>{sub}</text>}
    </g>
  );
};

// ---------------- ink-outlined SVG icons (200 x 200 design) ----------------
const S = { stroke: INK, strokeWidth: 7, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ICONS: Record<string, (c: string, c2: string) => React.ReactNode> = {
  phone: (c) => <><rect x={52} y={40} width={96} height={130} rx={10} fill={c} {...S} /><circle cx={80} cy={66} r={14} fill="#d9dde0" {...S} /><circle cx={120} cy={66} r={14} fill="#d9dde0" {...S} />
    <path d="M100 96 l-22 34 h44 z" fill="#3a3440" {...S} /><path d="M148 84 h22 v54" fill="none" {...S} /><rect x={160} y={130} width={20} height={44} rx={8} fill="#3a3440" {...S} /><path d="M52 150 h-24 v-34" fill="none" {...S} /></>,
  machine: (c, c2) => <><rect x={18} y={84} width={164} height={84} rx={8} fill={c} {...S} /><rect x={36} y={40} width={64} height={44} fill={c2} {...S} /><rect x={112} y={56} width={54} height={28} fill={c2} {...S} />
    <circle cx={64} cy={126} r={24} fill="#d9dde0" {...S} /><circle cx={64} cy={126} r={7} fill={INK} /><circle cx={124} cy={132} r={17} fill="#d9dde0" {...S} /><circle cx={124} cy={132} r={5} fill={INK} />
    <path d="M150 40 v-18 h18 M56 40 v-16 M80 40 v-22" fill="none" {...S} /><path d="M28 168 v16 M172 168 v16 M150 104 h24 M150 118 h24" fill="none" {...S} /><rect x={30} y={96} width={12} height={12} fill={INK} /><rect x={92} y={96} width={12} height={12} fill={INK} /></>,
  lino: (c, c2) => <><rect x={46} y={70} width={108} height={98} rx={8} fill={c} {...S} /><rect x={62} y={34} width={76} height={36} rx={6} fill={c2} {...S} /><path d="M60 142 h80 M60 126 h80" fill="none" {...S} />
    <rect x={70} y={92} width={60} height={20} fill="#f8f1dc" {...S} /><path d="M56 168 v16 M144 168 v16" fill="none" {...S} /></>,
  ship: (c, c2) => <><path d="M24 128 h152 l-22 40 h-108 z" fill={c} {...S} /><path d="M100 128 v-104" fill="none" {...S} /><path d="M100 30 q52 20 56 84 h-56 z" fill={c2} {...S} /><path d="M92 44 q-44 16 -50 70 h50 z" fill={c2} {...S} /><path d="M100 24 l26 8 l-26 8" fill={RED} {...S} /></>,
  tower: (c, c2) => <><path d="M56 184 v-116 h-10 v-36 h22 v16 h20 v-16 h24 v16 h20 v-16 h22 v36 h-10 v116 z" fill={c} {...S} /><rect x={82} y={86} width={36} height={44} rx={4} fill={c2} {...S} />
    <path d="M94 86 v44 M106 86 v44" fill="none" {...S} /><path d="M86 184 v-28 q14 -16 28 0 v28" fill="#5a4636" {...S} /></>,
  cup: (c) => <><path d="M46 84 h92 v50 q0 36 -46 36 q-46 0 -46 -36 z" fill={c} {...S} /><path d="M138 96 q34 0 34 22 q0 22 -36 22" fill="none" {...S} /><path d="M72 62 q-10 -14 0 -26 M96 62 q-10 -14 0 -26 M120 62 q-10 -14 0 -26" fill="none" {...S} /></>,
  medal: (c) => <><path d="M72 20 l28 64 l28 -64" fill={RED} {...S} /><circle cx={100} cy={124} r={52} fill={c} {...S} /><circle cx={100} cy={124} r={32} fill="none" {...S} strokeWidth={5} /><path d="M100 104 l6 14 h15 l-12 9 l5 15 l-14 -9 l-14 9 l5 -15 l-12 -9 h15 z" fill="#fff6c8" stroke={INK} strokeWidth={4} strokeLinejoin="round" /></>,
  computer: (c, c2) => <><rect x={34} y={30} width={132} height={104} rx={12} fill={c} {...S} /><rect x={50} y={46} width={100} height={72} rx={6} fill={c2} {...S} /><path d="M62 66 h46 M62 82 h70 M62 98 h34" fill="none" stroke={TEAL} strokeWidth={7} strokeLinecap="round" />
    <path d="M84 134 v18 h32 v-18" fill={c} {...S} /><rect x={30} y={152} width={140} height={24} rx={6} fill={c} {...S} /></>,
  safebox: (c, c2) => <><rect x={26} y={86} width={148} height={86} rx={8} fill={c} {...S} /><path d="M26 86 l18 -50 h112 l18 50" fill={c2} {...S} /><rect x={86} y={112} width={28} height={34} rx={5} fill={GOLD} {...S} /><circle cx={100} cy={126} r={5} fill={INK} /></>,
  hospital: (c, c2) => <><rect x={30} y={62} width={140} height={122} fill={c} {...S} /><rect x={70} y={26} width={60} height={36} fill={c} {...S} /><path d="M100 32 v24 M88 44 h24" fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round" />
    {[46, 86, 126].map((x) => <rect key={x} x={x} y={80} width={28} height={28} fill={c2} {...S} />)}{[46, 126].map((x) => <rect key={x} x={x} y={124} width={28} height={28} fill={c2} {...S} />)}<rect x={84} y={130} width={32} height={54} fill="#7a5a34" {...S} /></>,
  library: (c, c2) => <><path d="M20 76 l80 -50 l80 50 z" fill={c2} {...S} /><rect x={28} y={76} width={144} height={16} fill={c} {...S} />{[40, 76, 112, 148].map((x) => <rect key={x} x={x} y={92} width={14} height={70} fill={c} {...S} />)}<rect x={24} y={162} width={152} height={18} fill={c} {...S} />
    <path d="M86 44 h28 v18 h-28 z M100 44 v18" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" /></>,
  car: (c, c2) => <><path d="M18 132 q2 -30 34 -34 l22 -34 h62 q22 2 30 34 q18 4 18 34 z" fill={c} {...S} /><path d="M84 72 h46 q12 4 16 26 h-78 z" fill={c2} {...S} /><circle cx={58} cy={138} r={22} fill="#3a3440" {...S} /><circle cx={58} cy={138} r={8} fill="#d9dde0" />
    <circle cx={146} cy={138} r={22} fill="#3a3440" {...S} /><circle cx={146} cy={138} r={8} fill="#d9dde0" /></>,
  pin: (c) => <><path d="M40 150 l96 -96 q24 -14 30 10 q4 18 -18 26 l-88 60" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" /><path d="M40 150 l96 -96 q24 -14 30 10 q4 18 -18 26 l-88 60" fill="none" stroke={c} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={44} cy={152} r={20} fill={c} {...S} /></>,
  gear: (c) => <><path d="M100 22 l12 0 l6 22 l18 8 l20 -12 l16 16 l-12 20 l8 18 l22 6 v24 l-22 6 l-8 18 l12 20 l-16 16 l-20 -12 l-18 8 l-6 22 h-24 l-6 -22 l-18 -8 l-20 12 l-16 -16 l12 -20 l-8 -18 l-22 -6 v-24 l22 -6 l8 -18 l-12 -20 l16 -16 l20 12 l18 -8 l6 -22 z" fill={c} {...S} transform="translate(100 100) scale(0.78) translate(-100 -112)" /><circle cx={100} cy={100} r={24} fill="#fff" {...S} /></>,
  cards: (c, c2) => <><rect x={40} y={60} width={130} height={90} rx={8} fill={c2} {...S} transform="rotate(-10 100 100)" /><rect x={34} y={64} width={130} height={90} rx={8} fill={c} {...S} /><path d="M50 92 h98 M50 112 h98 M50 132 h62" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" /><rect x={34} y={64} width={130} height={18} fill={c2} {...S} /></>,
  news: (c) => <><rect x={28} y={34} width={144} height={136} rx={6} fill={c} {...S} /><rect x={44} y={50} width={112} height={22} fill={INK} /><path d="M44 90 h52 M44 106 h52 M44 122 h52 M44 138 h52 M44 154 h52" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" /><rect x={108} y={86} width={48} height={40} fill="#c9ccd2" {...S} strokeWidth={5} /><path d="M108 140 h48 M108 154 h48" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" /></>,
  chest: (c, c2) => <><rect x={30} y={96} width={140} height={76} rx={8} fill={c} {...S} /><path d="M30 96 q6 -62 70 -62 q64 0 70 62 z" fill={c2} {...S} transform="rotate(-24 30 96)" /><rect x={88} y={112} width={24} height={30} rx={4} fill={GOLD} {...S} /><path d="M30 128 h140" fill="none" {...S} /></>,
  crowd: (c, c2) => <>{[[60, 96, c2], [140, 96, c2], [100, 80, c]].map(([x, y, col], i) => <g key={i}><circle cx={x as number} cy={y as number} r={30} fill="#ffe2c2" {...S} /><path d={`M${(x as number) - 34} ${(y as number) + 92} q0 -58 34 -58 q34 0 34 58 z`} fill={col as string} {...S} /></g>)}</>,
  lever: (c, c2) => <><path d="M20 150 l160 -70" fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" /><path d="M20 150 l160 -70" fill="none" stroke={c2} strokeWidth={8} strokeLinecap="round" /><path d="M84 176 l22 -50 l22 50 z" fill="#7a5a34" {...S} />
    <rect x={132} y={22} width={56} height={56} rx={8} fill={c} {...S} /><circle cx={34} cy={126} r={16} fill={GOLD} {...S} /></>,
  crown: (c) => <><path d="M30 150 l-8 -84 l42 36 l36 -62 l36 62 l42 -36 l-8 84 z" fill={c} {...S} /><rect x={30} y={150} width={140} height={22} rx={6} fill={c} {...S} /><circle cx={100} cy={40} r={10} fill={RED} {...S} strokeWidth={5} /></>,
  heart: (c) => <path d="M100 172 q-76 -52 -76 -102 q0 -40 38 -40 q26 0 38 26 q12 -26 38 -26 q38 0 38 40 q0 50 -76 102 z" fill={c} {...S} />,
  check: (c) => <><circle cx={100} cy={100} r={78} fill={c} {...S} /><path d="M62 102 l28 28 l52 -58" fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" /></>,
  cross: (c) => <><circle cx={100} cy={100} r={78} fill={c} {...S} /><path d="M68 68 l64 64 M132 68 l-64 64" fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" /></>,
  flame: (c) => <path d="M100 20 q10 40 40 62 q26 22 26 54 q0 44 -66 46 q-66 -2 -66 -46 q0 -30 24 -46 q4 22 18 26 q-8 -52 24 -96 z" fill={c} {...S} />,
  door: (c, c2) => <><rect x={48} y={22} width={104} height={160} rx={6} fill={c} {...S} /><rect x={62} y={38} width={76} height={54} fill={c2} {...S} /><circle cx={134} cy={112} r={7} fill={GOLD} {...S} strokeWidth={4} /></>,
  desk: (c, c2) => <><rect x={16} y={110} width={168} height={18} rx={4} fill={c} {...S} /><path d="M32 128 v54 M168 128 v54" fill="none" {...S} /><rect x={50} y={86} width={54} height={24} fill="#f8f1dc" {...S} transform="rotate(-6 77 98)" /><rect x={112} y={78} width={44} height={32} fill={c2} {...S} /></>,
  mop: (c) => <><path d="M60 20 l56 128" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" /><path d="M60 20 l56 128" fill="none" stroke="#c99a5a" strokeWidth={7} strokeLinecap="round" /><path d="M84 150 q32 -18 64 0 l10 30 q-42 -12 -84 0 z" fill={c} {...S} /></>,
  bank: (c, c2) => <><path d="M16 78 l84 -52 l84 52 z" fill={c2} {...S} /><rect x={24} y={78} width={152} height={16} fill={c} {...S} />{[38, 74, 112, 148].map((x) => <rect key={x} x={x} y={94} width={14} height={66} fill={c} {...S} />)}<rect x={18} y={160} width={164} height={20} fill={c} {...S} /><circle cx={100} cy={58} r={10} fill={GOLD} {...S} strokeWidth={4} /></>,
};
export const Ico: React.FC<{ n: string; x: number; y: number; w: number; c?: string; c2?: string; s?: number; op?: number; rot?: number }> = ({ n, x, y, w, c = "#f4f1ea", c2 = "#c9ccd2", s = 1, op = 1, rot = 0 }) =>
  (s <= 0 || op <= 0 ? null : <svg viewBox="0 0 200 200" width={w} height={w} style={{ position: "absolute", left: x - w / 2, top: y - w / 2, opacity: op, transform: `rotate(${rot}deg) scale(${s})`, overflow: "visible" }}>{ICONS[n](c, c2)}</svg>);
