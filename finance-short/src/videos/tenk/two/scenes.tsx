// "How $10,000 Turns Into $1,000,000": one scene per 2D beat (same kit and hand as "4 Geniuses").
// Numbers on screen: $10,000 + $600/month at 8% a year (monthly compounding) for 30 years = $1,003,573; $10,000 alone =
// $109,357; after 10 / 20 years = $131,964 / $402,680; put in $226,000; half of the end value is reached in year 22.3;
// a 1-point fee (7%) ends at $813,148 (19% less). S&P 500: 1,565 (Oct 9 2007) -> 677 (Mar 9 2009, -57%) -> 1,569 (Mar 28 2013).
// J.P. Morgan: 7 of the 10 best days within two weeks of the 10 worst; missing the 10 best over 20 years leaves less than half.
import React from "react";
import { Ctx, PALS, Pal, Bg, Char, Fx, T, Box, Ico, Chart, Flag, Shadow, Pt, pop, fade, slide, out3, clamp, lerp, count, fmt, hh, INK, TEAL, GOLD, RED, GREEN } from "./kit";
import { Scene, Title, Head, Em, Bubble, FLOOR } from "./common";
import { HERO, fxCash, fxHouse, fxQuestion, fxStamp, fxCoin, fxBag } from "../toon";
export { Chip } from "./common";

const HE = { o: HERO, ok: "hero", id: 7 };
const at = (c: Ctx, w: string, n = 0, d = 3) => Math.max(0, c.c(w, n) - d);

// ---------------- the plan's numbers ----------------
const R = 0.08 / 12;
const grow = (pv: number, pm: number, years: number) => { const n = Math.round(years * 12), g = (1 + R) ** n; return pv * g + pm * ((g - 1) / R); };
const series = (fn: (y: number) => number, y0 = 0, y1 = 30): Pt[] => { const o: Pt[] = []; for (let y = y0; y <= y1 + 1e-9; y += 0.5) o.push([y, fn(y)]); return o; };
const PLAN = series((y) => grow(10000, 600, y));
const LONE = series((y) => grow(10000, 0, y));
const LATE = series((y) => (y < 10 ? 0 : grow(10000, 600, y - 10)), 10, 30);
const XL: [number, string][] = [[0, "TODAY"], [10, "10 YRS"], [20, "20 YRS"], [30, "30 YRS"]];
const YL: [number, string][] = [[250000, "$250K"], [500000, "$500K"], [750000, "$750K"], [1000000, "$1M"]];

// ---------------- shared pieces ----------------
const STEPS = ["DO\nNOTHING", "THREE\nCHECKS", "FREE\nMONEY", "WHOLE\nMARKET", "FEED IT", "DON'T\nSELL"];
/** the six-step staircase: step i grows at at[i]; hi = highlighted step */
const Stairs: React.FC<{ f: number; at: number[]; x?: number; y?: number; w?: number; h?: number; hi?: number; ink?: string; hideHi?: boolean }> = ({ f, at, x = 420, y = 900, w = 190, h = 82, hi = -1, ink = "#fff", hideHi }) => (
  <>
    {STEPS.map((lab, i) => {
      const s = pop(f, at[i], 12), top = y - (i + 1) * h, on = hi === i;
      if (s <= 0) return null;
      return (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: x + i * w, top, width: w - 6, height: (i + 1) * h, background: on ? GOLD : GREEN, border: `6px solid ${INK}`, borderRadius: 10, boxSizing: "border-box",
            transform: `scaleY(${s})`, transformOrigin: "50% 100%", boxShadow: on ? `0 0 ${30 + 10 * Math.sin(f * 0.2)}px rgba(255,201,74,0.8)` : undefined }} />
          <div style={{ position: "absolute", left: x + i * w + w / 2 - 33, top: top + 14, width: 54, height: 54, borderRadius: 30, background: "#fff", border: `5px solid ${INK}`, opacity: s,
            fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: "54px", textAlign: "center", color: INK }}>{i + 1}</div>
          <T x={x + i * w + w / 2 - 3} y={top - 46} size={30} color={on ? GOLD : ink} op={on && hideHi ? 0 : s} lh={1.0} w={w}>{lab}</T>
        </React.Fragment>
      );
    })}
  </>
);
/** a rounded label chip */
const Pill: React.FC<{ x: number; y: number; s: number; bg: string; color?: string; size?: number; w?: number; children: React.ReactNode }> = ({ x, y, s, bg, color = "#fff", size = 40, w, children }) =>
  s <= 0 ? null : <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, padding: "12px 28px", borderRadius: 18, background: bg, border: `6px solid ${INK}`, width: w,
    fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 900, fontSize: size, color, whiteSpace: "pre", textAlign: "center", boxShadow: "0 8px 0 rgba(36,23,38,0.18)" }}>{children}</div>;
/** a check box: empty, ticked (green) or crossed (red) */
const CheckBox: React.FC<{ x: number; y: number; s: number; state: 0 | 1 | 2; tick?: number; size?: number }> = ({ x, y, s, state, tick = 1, size = 110 }) => (
  <>
    <Box x={x} y={y} w={size} h={size} r={18} s={s} />
    {state === 1 && <Ico n="check" x={x} y={y} w={size * 0.9} c={GREEN} s={tick} />}
    {state === 2 && <Ico n="cross" x={x} y={y} w={size * 0.9} c={RED} s={tick} />}
  </>
);
/** a horizontal bar that grows from the left */
const HBar: React.FC<{ x: number; y: number; w: number; h?: number; u: number; color: string; label: string; value: string; ink: string }> = ({ x, y, w, h = 90, u, color, label, value, ink }) => (
  <>
    <T x={x - 24} y={y} a="r" size={40} color={ink} op={fade(u * 20, 0, 4)}>{label}</T>
    <div style={{ position: "absolute", left: x, top: y - h / 2, width: Math.max(0, w * out3(u)), height: h, background: color, border: u > 0 ? `6px solid ${INK}` : undefined, borderRadius: 12, boxSizing: "border-box" }} />
    <T x={x + w * out3(u) + 24} y={y} a="l" size={52} color={color} op={clamp(u * 3)} stroke={INK} sw={0}>{value}</T>
  </>
);
const money = (v: number) => "$" + fmt(v);
/** the 30-year chart with the plan line drawn up to `upTo` years */
const PlanChart: React.FC<{ p: Pal; upTo: number; lone?: number; late?: number; children?: (sx: (v: number) => number, sy: (v: number) => number) => React.ReactNode; x?: number; y?: number; w?: number; h?: number; op?: number }> =
  ({ p, upTo, lone = -1, late = -1, children, x = 330, y = 290, w = 1360, h = 600, op = 1 }) => (
  <>
    {lone >= 0 && <Chart x={x} y={y} w={w} h={h} pts={LONE} x0={0} x1={30} y0={0} y1={1100000} upTo={lone} color="#9aa0a6" ink={p.ink} soft="transparent" lw={8} op={op} />}
    {late >= 10 && <Chart x={x} y={y} w={w} h={h} pts={LATE} x0={0} x1={30} y0={0} y1={1100000} upTo={late} color={RED} ink={p.ink} soft="transparent" lw={9} op={op} />}
    <Chart x={x} y={y} w={w} h={h} pts={PLAN} x0={0} x1={30} y0={0} y1={1100000} upTo={upTo} color={p.acc} ink={p.ink} soft={p.soft} xl={XL} yl={YL} lw={11} op={op}>{children}</Chart>
  </>
);
const hero = (c: Ctx, x: number, y: number, h: number, extra: Partial<React.ComponentProps<typeof Char>> = {}) => <><Shadow x={x} y={y} w={h * 0.42} /><Char {...HE} x={x} y={y} h={h} f={c.f} {...extra} /></>;

export const SCENES: Record<string, Scene> = {
  // ================= HOOK =================
  h2: (c) => {
    const p = PALS.hook, gone = at(c, "gone", 0, 8), where = at(c, "where");
    const v = count(c.f, gone, gone + 34, 10000, 0), m = Math.min(12, Math.floor(c.f / 3));
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} a={0} y={140} size={88}>A <Em c={GOLD}>year</Em> later</Head>
        {Array.from({ length: 12 }, (_, i) => <Box key={i} x={1040 + (i % 6) * 120} y={300 + Math.floor(i / 6) * 120} w={96} h={96} r={14} bg={i < m ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)"} bd="rgba(255,255,255,0.35)" bw={4} shadow={false} s={pop(c.f, i * 2, 8)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 30, color: INK, textAlign: "center", lineHeight: "88px" }}>{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</div></Box>)}
        <T x={1340} y={640} size={170} color={c.f < gone ? GOLD : v > 0 ? "#fff" : RED} s={0.85 + 0.15 * pop(c.f, 4, 12)} op={fade(c.f, 4)} ls={-3}>{money(v)}</T>
        {hero(c, 470, FLOOR, 600, { expr: c.f < gone ? "smile" : c.f < where ? "shock" : "dazed", prop: c.f < gone ? "money" : "pockets" })}
        {[[-140, 300, 0], [130, 250, 4], [10, 170, 8]].map(([dx, yy, d], i) => <Fx key={i} k="q" cw={300} ch={300} draw={fxQuestion} x={470 + dx} y={yy} w={110} s={pop(c.f, where + d, 10)} rot={(i - 1) * 12} />)}
      </>
    );
  },
  h3: (c) => {
    const p = PALS.hook, car = at(c, "careless"), ord = at(c, "order", 0, 6);
    return (
      <>
        <Bg p={p} f={c.f} />
        <Pill x={560} y={330} s={pop(c.f, car, 12)} bg="#3a4a66" size={64}>CARELESS?</Pill>
        <Ico n="cross" x={800} y={300} w={110} c={RED} s={pop(c.f, car + 10, 10)} />
        <T x={1340} y={250} size={70} color={GOLD} op={fade(c.f, ord)} ls={2}>NO ORDER</T>
        {[3, 0, 5, 1, 4, 2].map((k, i) => <Box key={i} x={1060 + (i % 3) * 230 + 30 * Math.sin(i * 2.1)} y={470 + Math.floor(i / 3) * 210} w={190} h={150} r={18} bg={GREEN} rot={(hh(i, 3) - 0.5) * 40} s={pop(c.f, ord + i * 3, 10)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 80, color: "#fff", textAlign: "center", lineHeight: "136px" }}>{k + 1}</div></Box>)}
        {hero(c, 470, 960, 520, { expr: c.f < ord ? "nervous" : "dazed", look: 1 })}
      </>
    );
  },
  h4: (c) => {
    const p = PALS.hook, six = at(c, "six", 0, 2);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR + 40} />
        <Head c={c} p={p} a={0} y={130} size={80}>If I got <Em c={GOLD}>$10,000</Em> tomorrow</Head>
        {hero(c, 250, FLOOR + 40, 480, { expr: "smile", prop: "money", wave: c.f >= at(c, "exactly") && c.f < six ? 0.5 : undefined })}
        <Stairs f={c.f} at={[0, 1, 2, 3, 4, 5].map((i) => at(c, "exactly") + i * 5)} x={470} y={FLOOR + 40} />
        <T x={1500} y={300} size={110} color={GOLD} s={pop(c.f, six + 4, 12)}>6 STEPS</T>
      </>
    );
  },
  h5: (c) => {
    const p = PALS.hook, five = at(c, "five"), mil = at(c, "million", 0, 6);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR + 40} />
        <Stairs f={c.f} at={[-9, -9, -9, -9, -9, -9]} x={160} y={FLOOR + 40} hi={c.f >= five ? 4 : -1} />
        <T x={1590} y={300} size={86} color="#fff" op={fade(c.f, five + 6)}>$10,000</T>
        <T x={1590} y={410} size={70} color={GOLD} op={fade(c.f, five + 14)}>↓</T>
        <T x={1590} y={540} size={100} color={GOLD} s={0.8 + 0.2 * pop(c.f, mil, 12)} op={fade(c.f, mil)} ls={-2}>{money(count(c.f, mil, mil + 30, 10000, 1000000))}</T>
      </>
    );
  },

  // ================= CHAPTER CARDS =================
  c1: Title(PALS.s1, "1", "DO NOTHING", "For thirty days", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="smile_closed" prop="money" s={pop(c.f, 8, 14)} />),
  c2: Title(PALS.s2, "2", "THREE CHECKS", "Before a single dollar is invested", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="stern" s={pop(c.f, 8, 14)} />),
  c3: Title(PALS.s3, "3", "FREE MONEY", "The employer match", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="grin" prop="coin" s={pop(c.f, 8, 14)} />),
  c4: Title(PALS.s4, "4", "THE WHOLE MARKET", "One low-cost index fund", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="smile" s={pop(c.f, 8, 14)} />),
  c5: Title(PALS.s5, "5", "FEED IT", "Where the million comes from", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="grin" prop="money" s={pop(c.f, 8, 14)} />),
  c6: Title(PALS.s6, "6", "DO NOT SELL", "When the market falls", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="smile_closed" s={pop(c.f, 8, 14)} />),
  c7: Title(PALS.order, "", "THE ORDER", "Six steps, one at a time", (c) => <Char {...HE} x={1640} y={1010} h={760} f={c.f} expr="smile" wave={0.6} s={pop(c.f, 8, 14)} />),

  // ================= 1 · DO NOTHING =================
  s1b: (c) => {
    const p = PALS.s1, mv = at(c, "move"), intr = at(c, "interest"), wait = at(c, "wait");
    const u = clamp((c.f - mv - 8) / 26);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Park it somewhere <Em c={p.acc}>safe</Em></Head>
        {hero(c, 380, FLOOR, 560, { expr: "smile_closed", prop: c.f < mv + 8 ? "money" : null })}
        <Ico n="bank" x={1400} y={590} w={460} c="#f4f1ea" c2="#d9c9a8" s={pop(c.f, mv, 12)} />
        <Pill x={1400} y={860} s={pop(c.f, at(c, "highyield"), 10)} bg={p.acc} size={38}>HIGH-YIELD SAVINGS</Pill>
        {u > 0 && u < 1 && <Fx k="cash" cw={300} ch={150} draw={fxCash} x={lerp(520, 1400, out3(u))} y={560 - 160 * Math.sin(Math.PI * u)} w={180} />}
        {[0, 1, 2, 3].map((i) => <Fx key={i} k="coin" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={1240 + i * 105} y={340 - 10 * Math.sin(c.f * 0.15 + i)} w={84} s={pop(c.f, intr + i * 6, 10)} />)}
        <T x={1660} y={410} a="l" size={40} color={p.acc} op={fade(c.f, intr + 4)}>+ INTEREST</T>
        <Pill x={860} y={300} s={pop(c.f, wait, 10)} bg={p.acc2} size={38}>{`DAY ${Math.min(30, 1 + Math.max(0, Math.floor((c.f - wait) / 2)))}`}</Pill>
      </>
    );
  },
  s1c: (c) => {
    const p = PALS.s1, rich = at(c, "rich"), exp = at(c, "expensive", 0, 5);
    const items = ["NEW PHONE", "TRIP", "NEW CAR", "DINNERS OUT"];
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Feeling rich is <Em c={RED}>expensive</Em></Head>
        {hero(c, 960, FLOOR, 600, { expr: c.f < exp ? "grin" : "shock", prop: "money" })}
        <Ico n="crown" x={960} y={322} w={150} c={GOLD} s={pop(c.f, rich, 12)} rot={-6} />
        {items.map((t, i) => {
          const x = [360, 1560, 420, 1500][i], y = [430, 430, 700, 700][i];
          return <React.Fragment key={i}><Pill x={x} y={y} s={pop(c.f, exp + i * 5, 10)} bg="#fff" color={INK} size={40}>{t}</Pill><Pill x={x + 150} y={y + 62} s={pop(c.f, exp + i * 5 + 4, 10)} bg={RED} size={32}>– $$$</Pill></React.Fragment>;
        })}
      </>
    );
  },
  s1d: (c) => {
    const p = PALS.s1, th = at(c, "thirty"), month = at(c, "month"), wont = at(c, "won't", 0, 4);
    const crossed = Math.max(0, Math.min(30, Math.floor((c.f - th) / Math.max(1, (month - th) / 30))));
    const wish = ["NEW PHONE", "TRIP", "NEW CAR", "GAMING PC"];
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p}>The <Em c={p.acc}>30-day</Em> rule</Head>
        {Array.from({ length: 30 }, (_, i) => (
          <React.Fragment key={i}>
            <Box x={220 + (i % 6) * 118} y={340 + Math.floor(i / 6) * 118} w={100} h={100} r={12} s={pop(c.f, i, 8)} bg="#fff" bw={4}>
              <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 36, color: INK, textAlign: "center", lineHeight: "92px" }}>{i + 1}</div></Box>
            {i < crossed && <Ico n="cross" x={220 + (i % 6) * 118} y={340 + Math.floor(i / 6) * 118} w={84} c={p.acc} s={1} />}
          </React.Fragment>
        ))}
        <T x={1420} y={300} size={50} color={p.ink} op={fade(c.f, at(c, "still"))}>WISH LIST</T>
        {wish.map((t, i) => {
          const gone = i !== 1 && c.f >= wont + i * 3;
          return <React.Fragment key={i}>
            <Pill x={1420} y={410 + i * 120} s={pop(c.f, at(c, "still") + i * 4, 10)} bg="#fff" color={INK} size={42} w={380}>{t}</Pill>
            {gone && <div style={{ position: "absolute", left: 1240, top: 406 + i * 120, width: 360 * out3((c.f - wont - i * 3) / 8), height: 10, background: RED, borderRadius: 5 }} />}
          </React.Fragment>;
        })}
        <Ico n="check" x={1650} y={530} w={80} c={GREEN} s={pop(c.f, wont + 10, 10)} />
      </>
    );
  },

  // ================= 2 · THREE CHECKS =================
  s2a: (c) => {
    const p = PALS.s2, three = at(c, "three");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Before I invest a <Em c={p.acc2}>single dollar</Em></Head>
        {hero(c, 330, FLOOR, 560, { expr: "stern" })}
        {["DEBT ABOVE 8%?", "3 MONTHS OF COSTS?", "NEEDED IN 5 YEARS?"].map((t, i) => (
          <React.Fragment key={i}>
            <CheckBox x={760} y={400 + i * 170} s={pop(c.f, three + i * 5, 10)} state={0} />
            <T x={860} y={400 + i * 170} a="l" size={58} color={p.ink} op={fade(c.f, three + i * 5 + 4)}>{t}</T>
          </React.Fragment>
        ))}
      </>
    );
  },
  s2b: (c) => {
    const p = PALS.s2, cc = at(c, "credit"), mk = at(c, "market"), first = at(c, "first");
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={160} y={140} a="l" size={72} color={p.acc2} op={fade(c.f, 0)}>1</T>
        <T x={240} y={140} a="l" size={64} color={p.ink} op={fade(c.f, 4)}>Do I owe money above <Em c={p.acc}>8%</Em>?</T>
        <HBar x={620} y={430} w={860} u={(c.f - cc) / 24} color={RED} label="CREDIT CARD" value="24% / YEAR" ink={p.ink} />
        <HBar x={620} y={620} w={860 / 3} u={(c.f - mk) / 24} color={GREEN} label="THE MARKET" value="~8% AVERAGE" ink={p.ink} />
        <Fx k="stampfirst" cw={520} ch={200} draw={(q) => fxStamp(q, "PAY IT OFF FIRST")} x={1150} y={850} w={760} s={pop(c.f, first, 12)} rot={-4} />
      </>
    );
  },
  s2c: (c) => {
    const p = PALS.s2, tw = at(c, "thousand"), six = at(c, "six"), sell = at(c, "sell", 0, 4);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <T x={160} y={140} a="l" size={72} color={p.acc2} op={fade(c.f, 0)}>2</T>
        <T x={240} y={140} a="l" size={64} color={p.ink} op={fade(c.f, 4)}>Three months of costs in <Em c={GREEN}>cash</Em>?</T>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <Box x={520 + i * 300} y={480} w={260} h={200} r={20} bg="#fff" s={pop(c.f, tw + i * 6, 10)}>
              <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 34, color: "#6b7280", textAlign: "center", marginTop: 26 }}>{`MONTH ${i + 1}`}</div>
              <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 66, color: INK, textAlign: "center" }}>$2,000</div></Box>
          </React.Fragment>
        ))}
        <T x={820} y={690} size={110} color={GREEN} s={pop(c.f, six, 12)}>= $6,000</T>
        <Ico n="safebox" x={1560} y={520} w={300} c="#5b6b86" c2="#7d8ca6" s={pop(c.f, six + 6, 12)} />
        <Pill x={1560} y={760} s={pop(c.f, at(c, "safely"), 10)} bg={GREEN} size={36}>SITTING SAFELY</Pill>
        <Pill x={1560} y={300 + 20 * Math.sin(c.f * 0.2)} s={pop(c.f, at(c, "losing"), 10) * (c.f < sell + 12 ? 1 : 0)} bg={RED} size={36}>JOB LOST</Pill>
        <Pill x={1560} y={300} s={pop(c.f, sell + 12, 10)} bg={INK} size={36}>NO FORCED SELLING</Pill>
      </>
    );
  },
  s2d: (c) => {
    const p = PALS.s2, car = at(c, "car"), wed = at(c, "wedding"), dp = at(c, "down"), st = at(c, "stocks");
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={160} y={140} a="l" size={72} color={p.acc2} op={fade(c.f, 0)}>3</T>
        <T x={240} y={140} a="l" size={64} color={p.ink} op={fade(c.f, 4)}>Needed in the next <Em c={p.acc}>5 years</Em>?</T>
        <div style={{ position: "absolute", left: 260, top: 600, height: 10, width: 1400 * out3((c.f - 10) / 20), background: p.ink, borderRadius: 5, opacity: 0.6 }} />
        {[0, 1, 2, 3, 4, 5].map((y) => <T key={y} x={260 + y * 280} y={660} size={36} color={p.ink} op={0.7 * fade(c.f, 12 + y * 2)}>{y === 0 ? "NOW" : `${y} YR`}</T>)}
        <Ico n="car" x={620} y={460} w={220} c="#e9ecef" c2="#9fd3f0" s={pop(c.f, car, 10)} />
        <Ico n="heart" x={1000} y={460} w={180} c={RED} s={pop(c.f, wed, 10)} />
        <Fx k="house" cw={300} ch={300} draw={fxHouse} x={1400} y={450} w={230} s={pop(c.f, dp, 10)} />
        <Pill x={960} y={860} s={pop(c.f, st, 12)} bg="#fff" color={INK} size={52}>STOCKS</Pill>
        <Ico n="cross" x={1120} y={830} w={110} c={RED} s={pop(c.f, st + 8, 10)} />
      </>
    );
  },
  s2e: (c) => {
    const p = PALS.s2, wrong = at(c, "wrong"), pass = at(c, "pass"), mv = at(c, "moves");
    const u = out3((c.f - mv) / 22);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Fix it first, then <Em c={GREEN}>invest</Em></Head>
        {["DEBT ABOVE 8%", "3 MONTHS SAVED", "NOT NEEDED SOON"].map((t, i) => (
          <React.Fragment key={i}>
            <CheckBox x={380} y={380 + i * 170} s={1} state={c.f >= pass + i * 5 ? 1 : c.f >= wrong && i === 0 ? 2 : 0} tick={pop(c.f, c.f >= pass + i * 5 ? pass + i * 5 : wrong, 10)} />
            <T x={480} y={380 + i * 170} a="l" size={56} color={p.ink}>{t}</T>
          </React.Fragment>
        ))}
        <Pill x={lerp(1420, 2300, u)} y={560} s={pop(c.f, pass + 12, 12)} bg={GREEN} size={84}>$10,000 →</Pill>
      </>
    );
  },

  // ================= 3 · FREE MONEY =================
  s3a: (c) => {
    const p = PALS.s3, emp = at(c, "employers"), fifty = at(c, "fifty"), lim = at(c, "limit");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>The employer <Em c={p.acc}>match</Em></Head>
        {hero(c, 330, FLOOR, 540, { expr: "smile", prop: "coin" })}
        <Box x={820} y={520} w={380} h={300} r={24} bg="#fff" s={pop(c.f, emp, 12)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 36, color: "#6b7280", textAlign: "center", marginTop: 40 }}>YOU PUT IN</div>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 110, color: INK, textAlign: "center" }}>$1.00</div></Box>
        <T x={1110} y={520} size={110} color={p.acc} op={fade(c.f, fifty)}>+</T>
        <Box x={1420} y={520} w={420} h={300} r={24} bg={p.acc} s={pop(c.f, fifty, 12)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 36, color: "#eaffef", textAlign: "center", marginTop: 40 }}>EMPLOYER ADDS</div>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 110, color: "#fff", textAlign: "center" }}>$0.50</div></Box>
        <Pill x={1420} y={760} s={pop(c.f, lim, 10)} bg="#fff" color={INK} size={34}>UP TO A LIMIT</Pill>
      </>
    );
  },
  s3b: (c) => {
    const p = PALS.s3, fifty = at(c, "fifty", 0, 4), beat = at(c, "beats");
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={330} size={300} color={p.acc} s={0.7 + 0.3 * pop(c.f, fifty, 14)} op={fade(c.f, fifty)} ls={-6}>+50%</T>
        <Pill x={960} y={530} s={pop(c.f, at(c, "day"), 10)} bg={p.acc2} size={48}>ON DAY ONE</Pill>
        <HBar x={640} y={720} w={1000} u={(c.f - beat) / 22} color={p.acc} label="THE MATCH" value="+50%" ink={p.ink} h={80} />
        <HBar x={640} y={860} w={160} u={(c.f - beat - 8) / 22} color="#9aa0a6" label="A GOOD YEAR" value="~8%" ink={p.ink} h={80} />
      </>
    );
  },
  s3c: (c) => {
    const p = PALS.s3, first = at(c, "first"), after = at(c, "after"), tax = at(c, "taxed"), mine = at(c, "mine", 0, 6);
    const hA = 320, hB = 320 + 140 * out3((c.f - mine) / 20);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Where the first dollars go</Head>
        <Pill x={480} y={340} s={pop(c.f, first, 10)} bg={p.acc} size={44}>1 · ACCOUNT WITH THE MATCH</Pill>
        <Pill x={480} y={460} s={pop(c.f, after, 10)} bg={p.acc2} size={44}>2 · TAX-ADVANTAGED (IRA)</Pill>
        {[["TAXED EVERY YEAR", hA, "#9aa0a6", 1220], ["TAX-ADVANTAGED", hB, p.acc, 1560]].map(([t, h, col, x], i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: (x as number) - 120, top: FLOOR - (h as number), width: 240, height: h as number, background: col as string, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box",
              transform: `scaleY(${pop(c.f, tax + i * 6, 12)})`, transformOrigin: "50% 100%" }} />
            <T x={x as number} y={FLOOR + 50} size={34} color={p.ink} op={fade(c.f, tax + i * 6)}>{t as string}</T>
          </React.Fragment>
        ))}
        <T x={1560} y={FLOOR - hB - 60} size={56} color={p.acc} op={fade(c.f, mine)}>MORE STAYS MINE</T>
        {hero(c, 470, FLOOR, 360, { expr: c.f < mine ? "smile_closed" : "grin" })}
      </>
    );
  },

  // ================= 4 · THE WHOLE MARKET =================
  s4a: (c) => {
    const p = PALS.s4, home = at(c, "home"), fr = at(c, "friend"), coin = at(c, "coin");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>$10,000 needs a <Em c={GOLD}>home</Em></Head>
        <Fx k="house" cw={300} ch={300} draw={fxHouse} x={420} y={560} w={420} s={pop(c.f, home, 12)} />
        <Pill x={420} y={820} s={pop(c.f, home + 6, 10)} bg={GREEN} size={48}>$10,000</Pill>
        <Pill x={1150} y={460} s={pop(c.f, fr, 10)} bg="#3a4a66" size={50}>A FRIEND'S HOT STOCK</Pill>
        <Ico n="cross" x={1500} y={420} w={110} c={RED} s={pop(c.f, fr + 14, 10)} />
        <Fx k="coinX" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={1150} y={700} w={170} s={pop(c.f, coin, 10)} />
        <T x={1150} y={830} size={48} color="#fff" op={fade(c.f, coin)}>A COIN</T>
        <Ico n="cross" x={1290} y={660} w={110} c={RED} s={pop(c.f, coin + 8, 10)} />
      </>
    );
  },
  s4b: (c) => {
    const p = PALS.s4, fund = at(c, "index"), th = at(c, "thousands"), fail = at(c, "fails");
    const N = 16 * 9;
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={140}>One fund · <Em c={GOLD}>thousands</Em> of companies</Head>
        <Box x={960} y={600} w={1300} h={680} r={36} bg="rgba(255,255,255,0.06)" bd={TEAL} bw={8} shadow={false} s={pop(c.f, fund, 14)} />
        <T x={960} y={300} size={52} color={TEAL} op={fade(c.f, fund + 6)}>LOW-COST INDEX FUND</T>
        {Array.from({ length: N }, (_, i) => {
          const x = 410 + (i % 16) * 73, y = 380 + Math.floor(i / 16) * 62, bad = i === 77, d = th + Math.floor(hh(i, 4) * 26);
          const dy = bad && c.f >= fail ? 40 * clamp((c.f - fail) / 10) : 0;
          return c.f < d ? null : <div key={i} style={{ position: "absolute", left: x, top: y + dy, width: 54, height: 44, borderRadius: 6, background: bad && c.f >= fail ? RED : ["#2BD9A8", "#5b9be0", "#FFC94A", "#e9ecef"][i % 4],
            border: `4px solid ${INK}`, boxSizing: "border-box", opacity: bad && c.f >= fail ? 1 - clamp((c.f - fail - 14) / 10) : 1 }} />;
        })}
        <Pill x={960} y={980} s={pop(c.f, at(c, "barely"), 10)} bg={GREEN} size={40}>ONE FAILS · BARELY NOTICED</Pill>
      </>
    );
  },
  s4c: (c) => {
    const p = PALS.s4, fee = at(c, "fee"), one = at(c, "one", 1), fifth = at(c, "fifth", 0, 4), hun = at(c, "hundredths");
    const eat = 0.19 * out3((c.f - fifth) / 24);
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={140}>Look at <Em c={GOLD}>the fee</Em></Head>
        <Pill x={560} y={330} s={pop(c.f, one, 10)} bg={RED} size={56}>1% A YEAR</Pill>
        <T x={560} y={420} size={36} color="#fff" op={0.75 * fade(c.f, one + 10)}>sounds tiny…</T>
        <T x={960} y={560} size={40} color="#fff" op={fade(c.f, at(c, "thirty"))}>WHAT YOU END UP WITH AFTER 30 YEARS</T>
        <div style={{ position: "absolute", left: 260, top: 620, width: 1400 * out3((c.f - at(c, "thirty")) / 20), height: 130, background: GREEN, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box" }} />
        {eat > 0 && <div style={{ position: "absolute", left: 260 + 1400 * (1 - eat), top: 620, width: 1400 * eat, height: 130, background: RED, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box" }} />}
        <T x={1520} y={810} size={52} color={RED} op={fade(c.f, fifth + 10)}>≈ 1/5 GONE</T>
        <Pill x={1360} y={330} s={pop(c.f, hun, 10)} bg={GREEN} size={56}>0.03%</Pill>
        <T x={1360} y={420} size={36} color="#fff" op={0.75 * fade(c.f, at(c, "almost", 0) )}>almost nothing</T>
        <T x={960} y={960} size={28} color="#fff" op={0.5 * fade(c.f, fee)}>{"example: 8% vs 7% a year on the plan in step 5"}</T>
      </>
    );
  },

  // ================= 5 · FEED IT =================
  s5a: (c) => {
    const p = PALS.s5, gr = at(c, "grows"), th = at(c, "thirty"), not = at(c, "not");
    const up = lerp(0, 30, out3((c.f - gr) / Math.max(10, th - gr + 10)));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={110} size={64}>$10,000 alone at 8%</Head>
        <Chart x={330} y={260} w={1360} h={620} pts={LONE} x0={0} x1={30} y0={0} y1={1100000} upTo={c.f < gr ? 0 : up} color="#9aa0a6" ink={p.ink} soft={p.soft} xl={XL} yl={YL} lw={11}>
          {(sx, sy) => <>
            <line x1={0} x2={sx(30)} y1={sy(1000000)} y2={sy(1000000)} stroke={p.acc} strokeWidth={6} strokeDasharray="18 14" opacity={fade(c.f, 6)} />
            <text x={sx(15)} y={sy(1000000) - 18} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={900} fontSize={40} fill={p.acc} opacity={fade(c.f, 10)}>THE GOAL: $1,000,000</text>
            <Flag cx={sx(30)} cy={sy(109357)} label="$109,000" color="#7a7f86" s={pop(c.f, th + 6, 12)} dx={-60} len={110} />
          </>}
        </Chart>
        <Fx k="stampNot" cw={520} ch={200} draw={(q) => fxStamp(q, "NOT A MILLION")} x={1000} y={560} w={640} s={pop(c.f, not, 12)} rot={-6} />
      </>
    );
  },
  s5b: (c) => {
    const p = PALS.s5, six = at(c, "six"), ev = at(c, "every"), auto = at(c, "automatically"), pay = at(c, "paycheck");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>What I <Em c={p.acc}>add</Em> every month</Head>
        <Box x={420} y={470} w={360} h={220} r={22} bg="#fff" s={pop(c.f, pay > 0 ? Math.min(pay, six) : six, 12)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 56, color: INK, textAlign: "center", marginTop: 70 }}>PAYDAY</div></Box>
        <div style={{ position: "absolute", left: 620, top: 462, height: 16, width: 520 * out3((c.f - six) / 16), background: p.acc, borderRadius: 8 }} />
        <Pill x={880} y={400} s={pop(c.f, six + 4, 10)} bg={p.acc} size={60}>$600</Pill>
        <Box x={1420} y={470} w={360} h={220} r={22} bg={p.acc} s={pop(c.f, six + 8, 12)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 56, color: "#fff", textAlign: "center", marginTop: 70 }}>INDEX FUND</div></Box>
        {Array.from({ length: 12 }, (_, i) => <Pill key={i} x={330 + i * 115} y={760} s={pop(c.f, ev + i * 3, 8)} bg="#fff" color={INK} size={26}>{["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][i]}</Pill>)}
        {Array.from({ length: 12 }, (_, i) => <Ico key={i} n="check" x={330 + i * 115} y={850} w={56} c={GREEN} s={pop(c.f, ev + 8 + i * 3, 8)} />)}
        <Pill x={1420} y={640} s={pop(c.f, auto, 12)} bg={p.acc2} size={44}>AUTOMATIC</Pill>
      </>
    );
  },
  s5c: (c) => {
    const p = PALS.s5, t10 = at(c, "ten"), t20 = at(c, "twenty"), t30 = at(c, "thirty"), mil = at(c, "million", 0, 6);
    const up = c.f < t10 ? lerp(0, 10, out3(c.f / Math.max(1, t10))) : c.f < t20 ? lerp(10, 20, out3((c.f - t10) / Math.max(1, t20 - t10))) : lerp(20, 30, out3((c.f - t20) / Math.max(1, t30 - t20 + 10)));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={110} size={64}>$10,000 + <Em c={p.acc}>$600 a month</Em> at 8%</Head>
        <PlanChart p={p} upTo={up} lone={30}>
          {(sx, sy) => <>
            <Flag cx={sx(10)} cy={sy(131964)} label="$132,000" color={p.acc} s={pop(c.f, t10 + 8, 12)} len={150} />
            <Flag cx={sx(20)} cy={sy(402680)} label="$400,000" color={p.acc} s={pop(c.f, t20 + 8, 12)} len={150} />
            <Flag cx={sx(30)} cy={sy(1003573)} label="$1,003,000" color={GOLD} s={pop(c.f, mil, 12)} dx={-140} len={60} up={false} />
          </>}
        </PlanChart>
      </>
    );
  },
  s5d: (c) => {
    const p = PALS.s5, put = at(c, "put"), rest = at(c, "rest");
    const H0 = 500, k = H0 / 1003573;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>What I put in vs. what I end with</Head>
        {[["I PUT IN", 226000, p.acc2, 700, put], ["I END WITH", 1003573, p.acc, 1220, put + 10]].map(([t, v, col, x, a], i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: (x as number) - 150, top: FLOOR - (v as number) * k, width: 300, height: (v as number) * k, background: col as string, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box",
              transform: `scaleY(${pop(c.f, a as number, 14)})`, transformOrigin: "50% 100%" }} />
            <T x={x as number} y={FLOOR - (v as number) * k - 50} size={60} color={col as string} op={fade(c.f, (a as number) + 8)}>{money(v as number)}</T>
            <T x={x as number} y={FLOOR + 50} size={38} color={p.ink} op={fade(c.f, (a as number) + 4)}>{t as string}</T>
          </React.Fragment>
        ))}
        <div style={{ position: "absolute", left: 1400, top: FLOOR - 1003573 * k, width: 26, height: (1003573 - 226000) * k, borderTop: `8px solid ${GOLD}`, borderRight: `8px solid ${GOLD}`, borderBottom: `8px solid ${GOLD}`, opacity: fade(c.f, rest), borderRadius: 6 }} />
        <T x={1460} y={FLOOR - 1003573 * k + (1003573 - 226000) * k / 2} a="l" size={50} color={p.ink} op={fade(c.f, rest + 4)} w={420}>{"GROWTH\nON GROWTH\n≈ $777,000"}</T>
      </>
    );
  },
  s5e: (c) => {
    const p = PALS.s5, half = at(c, "half"), wait = at(c, "wait"), late = at(c, "later");
    const L = c.f < late ? 0 : lerp(10, 30, out3((c.f - late) / 40));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={110} size={64}>{c.f < wait ? <>Half of it comes in the <Em c={GOLD}>last 8 years</Em></> : <>The most expensive thing: <Em c={RED}>waiting</Em></>}</Head>
        <PlanChart p={p} upTo={30} late={L}>
          {(sx, sy) => <>
            <rect x={sx(22.3)} y={0} width={(sx(30) - sx(22.3)) * out3((c.f - half) / 16)} height={sy(0)} fill={GOLD} opacity={0.22} />
            <line x1={0} x2={sx(30)} y1={sy(501786)} y2={sy(501786)} stroke={p.ink} strokeWidth={4} strokeDasharray="12 10" opacity={0.5 * fade(c.f, half)} />
            <text x={sx(26.15)} y={sy(1003573) + 70} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={900} fontSize={34} fill={p.ink} opacity={fade(c.f, half + 6)}>LAST 8 YEARS</text>
            {L >= 29.9 && <Flag cx={sx(30)} cy={sy(402680)} label="$400,000" sub="STARTED 10 YEARS LATE" color={RED} s={pop(c.f, late + 40, 12)} dx={-250} len={50} up={false} />}
          </>}
        </PlanChart>
      </>
    );
  },
  s5f: (c) => {
    const p = PALS.s5, as = at(c, "assumption"), time = at(c, "time");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Box x={960} y={330} w={1180} h={200} r={26} bg="#fff" s={pop(c.f, as - 6, 12)}>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 64, color: INK, textAlign: "center", marginTop: 32 }}>8% = AN ASSUMPTION</div>
          <div style={{ fontFamily: "Inter Display, Inter", fontWeight: 800, fontSize: 44, color: p.acc2, textAlign: "center" }}>not a promise</div></Box>
        {hero(c, 700, FLOOR, 480, { expr: c.f < time ? "neutral" : "smile" })}
        <T x={1200} y={700} size={170} color={GOLD} s={0.8 + 0.2 * pop(c.f, time, 12)} op={fade(c.f, time)} stroke={INK} sw={10}>TIME</T>
      </>
    );
  },

  // ================= 6 · DO NOT SELL =================
  s6b: (c) => {
    const p = PALS.s6, fell = at(c, "fell"), sold = at(c, "sold"), held = at(c, "held"), rec = at(c, "record");
    const SP: Pt[] = [[2007.77, 1565], [2008.4, 1400], [2008.75, 1100], [2008.9, 850], [2009.18, 677], [2009.6, 1000], [2009.99, 1115], [2010.5, 1030], [2010.99, 1258],
      [2011.3, 1360], [2011.75, 1120], [2012.25, 1405], [2012.85, 1380], [2013.24, 1569]];
    const up = c.f < fell ? 2007.77 : c.f < held ? lerp(2007.77, 2009.18, out3((c.f - fell) / 30)) : lerp(2009.18, 2013.24, out3((c.f - held) / 50));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={110} size={64}>The S&P 500, 2007 – 2013</Head>
        <Chart x={330} y={260} w={1360} h={600} pts={SP} x0={2007.5} x1={2013.5} y0={200} y1={1700} upTo={up} color={RED} color2={GREEN} split={2009.18} ink={p.ink} soft={p.soft}
          xl={[[2008, "2008"], [2009, "2009"], [2010, "2010"], [2011, "2011"], [2012, "2012"], [2013, "2013"]]} yl={[[400, "400"], [800, "800"], [1200, "1,200"], [1600, "1,600"]]}>
          {(sx, sy) => <>
            <Flag cx={sx(2009.18)} cy={sy(677)} label="–57%" sub="MARCH 2009" color={RED} s={pop(c.f, at(c, "fiftyseven") + 4, 12)} up={false} len={50} dx={120} />
            <Flag cx={sx(2009.18)} cy={sy(677)} label="SOLD = LOSS LOCKED IN" color="#7a1f1a" s={pop(c.f, sold + 6, 12)} len={260} dx={-40} />
            <Flag cx={sx(2013.24)} cy={sy(1569)} label="NEW HIGH" sub="MARCH 2013" color={GREEN} s={pop(c.f, rec, 12)} dx={-170} len={40} up={false} />
          </>}
        </Chart>
      </>
    );
  },
  s6c: (c) => {
    const p = PALS.s6, best = at(c, "best"), seven = at(c, "seven"), miss = at(c, "miss"), half = at(c, "half", 0, 6);
    const worst = [1, 3, 4, 6, 7, 9, 11, 12, 14, 16], near = [0, 1, 3, 4, 5, 7, 9];
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={110} size={64}>The best days hide next to the <Em c={RED}>worst</Em></Head>
        <div style={{ position: "absolute", left: 160, top: 420, height: 8, width: 1600, background: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
        {worst.map((x, i) => {
          const wx = 200 + x * 92, isNear = near.includes(i), bx = isNear ? wx + 46 : 200 + ({ 2: 0, 6: 13, 8: 17 } as Record<number, number>)[i] * 92;
          return <React.Fragment key={i}>
            <Ico n="cross" x={wx} y={470} w={60} c={RED} s={pop(c.f, best + i * 2, 8)} />
            <Ico n="check" x={bx} y={370} w={60} c={GREEN} s={pop(c.f, best + 10 + i * 2, 8)} />
            {isNear && <div style={{ position: "absolute", left: wx - 38, top: 324, width: 130, height: 190, borderRadius: 24, border: `5px solid ${GOLD}`, opacity: fade(c.f, seven + near.indexOf(i) * 3) }} />}
          </React.Fragment>;
        })}
        <T x={960} y={580} size={42} color={GOLD} op={fade(c.f, seven)}>7 OF THE 10 BEST DAYS: WITHIN 2 WEEKS OF THE 10 WORST</T>
        <HBar x={660} y={740} w={1000} u={(c.f - miss) / 22} color={GREEN} label="STAYED IN" value="" ink={p.ink} h={80} />
        <HBar x={660} y={870} w={460} u={(c.f - miss - 10) / 22} color={RED} label="MISSED 10 BEST" value="LESS THAN HALF" ink={p.ink} h={80} />
        <T x={1780} y={1030} a="r" size={26} color="#fff" op={0.55 * fade(c.f, half)}>Source: J.P. Morgan Asset Management, 20 years of the S&P 500</T>
      </>
    );
  },
  s6d: (c) => {
    const p = PALS.s6, bor = at(c, "boring"), six = at(c, "six"), close = at(c, "close", 0, 2);
    const down = out3((c.f - close) / 14);
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p}>Do the most <Em c={GOLD}>boring</Em> thing</Head>
        <Box x={560} y={540 + 500 * down} w={300} h={540} r={40} bg="#1b2433" bd="#e9ecef" bw={10} op={1 - down} shadow={false}>
          <svg width={260} height={300} style={{ position: "absolute", left: 10, top: 90 }}><polyline points="10,40 60,70 100,60 140,150 190,130 240,250" fill="none" stroke={RED} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" /></svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 410, textAlign: "center", fontFamily: "Inter Display, Inter", fontWeight: 900, fontSize: 52, color: RED }}>–30%</div></Box>
        <Pill x={560} y={520} s={pop(c.f, close + 10, 10)} bg="#3a4a66" size={52}>APP CLOSED</Pill>
        <Pill x={1340} y={330} s={pop(c.f, bor, 10)} bg={GOLD} color={INK} size={48}>BORING = GOOD</Pill>
        {Array.from({ length: 6 }, (_, i) => <Pill key={i} x={980 + i * 105} y={560} s={pop(c.f, six + i * 4, 8)} bg={GREEN} size={30}>$600</Pill>)}
        {Array.from({ length: 6 }, (_, i) => <Ico key={i} n="check" x={980 + i * 105} y={650} w={60} c={GREEN} s={pop(c.f, six + 6 + i * 4, 8)} />)}
        {hero(c, 1720, FLOOR, 420, { expr: "smile_closed" })}
      </>
    );
  },

  // ================= THE ORDER =================
  o1: (c) => {
    const p = PALS.order, ks = ["nothing", "run", "take", "buy", "feed", "not"].map((w) => at(c, w, 0, 2));
    const on = ks.filter((k) => c.f >= k + 10).length - 1;
    const x0 = 420, w = 190, h = 82, y0 = FLOOR + 40;
    const hx = on < 0 ? x0 - 120 : x0 + on * w + w / 2, hy = on < 0 ? y0 : y0 - (on + 1) * h;
    return (
      <>
        <Bg p={p} f={c.f} floor={y0} />
        <Head c={c} p={p} y={120} size={72}>The order</Head>
        <Stairs f={c.f} at={ks} x={x0} y={y0} hi={on} hideHi />
        {on >= 0 && <T x={1560} y={330} size={84} color={GOLD} s={pop(c.f, ks[on], 10)} w={600} lh={1.0}>{`${on + 1}\n${STEPS[on].replace("\n", " ")}`}</T>}
        <Char {...HE} x={hx} y={hy} h={330} f={c.f} expr={on >= 5 ? "grin" : "smile"} wave={on >= 5 ? 0.6 : undefined} />
      </>
    );
  },
  o2: (c) => {
    const p = PALS.order, luck = at(c, "luck"), time = at(c, "time"), ord = at(c, "order");
    return (
      <>
        <Bg p={p} f={c.f} />
        <Pill x={960} y={300} s={pop(c.f, luck, 12)} bg="#3a4a66" size={80}>LUCK</Pill>
        <Ico n="cross" x={1150} y={260} w={120} c={RED} s={pop(c.f, luck + 10, 10)} />
        <T x={700} y={640} size={150} color={GOLD} s={pop(c.f, time, 12)} stroke={INK} sw={8}>TIME</T>
        <T x={960} y={640} size={110} color="#fff" op={fade(c.f, ord - 4)}>+</T>
        <T x={1260} y={640} size={150} color={TEAL} s={pop(c.f, ord, 12)} stroke={INK} sw={8}>ORDER</T>
      </>
    );
  },
};

/** end card after the voice: room for two YouTube end-screen videos and the subscribe button */
export const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const p = PALS.order;
  return (
    <>
      <Bg p={p} f={f} />
      <T x={960} y={170} size={92} color={GOLD} op={fade(f, 0, 12)} ls={2}>VACKO</T>
      <T x={960} y={250} size={34} wt={800} color="#fff" op={0.75 * fade(f, 6, 12)} ls={3}>MONEY STORIES</T>
      {[560, 1360].map((x, i) => <Box key={i} x={x} y={600} w={700} h={394} r={28} bg="rgba(255,255,255,0.06)" bd="rgba(255,255,255,0.25)" bw={5} shadow={false} s={pop(f, 8 + i * 5, 12)} />)}
      <Char {...HE} x={960} y={1060} h={300} f={f} expr="smile" wave={0.6} s={pop(f, 4, 12)} />
    </>
  );
};
