// Scenes for chapter 4 (Long-Term Capital Management), the pattern, and Ronald Read.
import React from "react";
import { Ctx, PALS, Pal, Bg, Char, Fx, T, Box, Ico, Chart, Shadow, Pt, pop, fade, slide, ease, out3, clamp, lerp, count, fmt, hh, INK, NAVY, TEAL, GOLD, RED, GREEN } from "./kit";
import { Scene, FLOOR, Head, Em, Title, Mistake, NW, Bubble } from "./scenes";
import { TW, FI, Stamp, Badge } from "./scenes2";
import { MERI_O, PARTNER, READ, townie, fxCoin, fxBag, fxStack, fxQuestion, fxBasket, fxSoap, fxPill, fxBulb, fxBreakfast, fxGlobe, fxWarning, fxIntegral } from "../toon";

const MW = { o: MERI_O, ok: "meri", id: 10 }, RR = { o: READ, ok: "read", id: 11 };
const PT = [0, 1, 2, 3].map((v) => ({ o: PARTNER(v), ok: "partner" + v, id: 60 + v }));
const Spot: React.FC<{ x: number; y: number; w: number; h: number; op?: number }> = ({ x, y, w, h, op = 0.16 }) =>
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, background: `radial-gradient(closest-side, rgba(255,255,255,${op}), rgba(255,255,255,0))` }} />;
/** the five partners in a row; `expr` per person */
const Team: React.FC<{ c: Ctx; y?: number; h?: number; expr: (i: number) => "smile" | "smile_closed" | "grin" | "sad" | "pained" | "neutral" | "nervous" | "shock"; a?: number }> = ({ c, y = FLOOR, h = 520, expr, a = 0 }) => <>
  <Spot x={960} y={y - 250} w={1700} h={900} op={0.26} />
  {[420, 690, 960, 1230, 1500].map((x, i) => { const w = i === 2 ? MW : PT[i < 2 ? i : i - 1]; return <React.Fragment key={i}><Shadow x={x} y={y} w={h * 0.42} op={0.35} /><Char {...w} x={x} y={y} h={i === 2 ? h * 1.06 : h} f={c.f} expr={expr(i)} s={pop(c.f, a + Math.abs(i - 2) * 4, 12)} /></React.Fragment>; })}
</>;
/** two almost identical price lines; gap(i) gives their distance along the way, drawn up to u */
const Lines: React.FC<{ x0: number; x1: number; y: number; u: number; gap: (t: number) => number; colA?: string; colB?: string }> = ({ x0, x1, y, u, gap, colA = TEAL, colB = GOLD }) => {
  const N = 60, n = Math.max(1, Math.round(N * clamp(u)));
  const pts = (sgn: number) => Array.from({ length: n + 1 }, (_, i) => { const t = i / N; return `${lerp(x0, x1, t).toFixed(1)},${(y + sgn * gap(t) / 2 + 9 * Math.sin(i * 0.7) + 6 * Math.sin(i * 1.9 + 1)).toFixed(1)}`; }).join(" ");
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      {[-1, 1].map((sg) => <polyline key={sg} points={pts(sg)} fill="none" stroke={sg < 0 ? colA : colB} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />)}
    </svg>
  );
};
/** the fund's balance sheet as a tower: one "own" block and n borrowed blocks on top */
const Tower: React.FC<{ x: number; n: number; own?: number; cut?: number; ownCol?: string }> = ({ x, n, own = 1, cut = 0, ownCol = TEAL }) => <>
  {Array.from({ length: Math.round(n) }, (_, i) => i >= 25 - cut ? null : <div key={i} style={{ position: "absolute", left: x - 170, top: 826 - (i + 1) * 26, width: 340, height: 24, background: i % 2 ? "#8f97a8" : "#a5acbb", border: `3px solid ${INK}`, boxSizing: "border-box", borderRadius: 4 }} />)}
  <div style={{ position: "absolute", left: x - 170, top: 830, width: 340, height: 50, background: ownCol, border: `5px solid ${INK}`, boxSizing: "border-box", borderRadius: 6, transform: `scale(${own})` }} />
</>;
const bell = (x0: number, x1: number, base: number, h: number) => Array.from({ length: 61 }, (_, i) => { const z = -3.2 + (6.4 * i) / 60; return `${lerp(x0, x1, i / 60).toFixed(1)},${(base - h * Math.exp(-z * z / 2)).toFixed(1)}`; }).join(" ");
const MIS: [string, string, string, string][] = [["crowd", "THE CROWD", "The stock everyone at work\nis talking about", "followed the crowd"], ["basket", "ONE BASKET", "All your savings in one\ncompany, or one coin", "bet everything on one idea"],
  ["lever", "LEVERAGE", "Trading on margin", "borrowed to buy more"], ["crown", "OVERCONFIDENCE", "“This time, I know.”", "believed it couldn't be wrong"]];
const MisIcon: React.FC<{ k: string; x: number; y: number; w: number; s?: number }> = ({ k, x, y, w, s = 1 }) => k === "basket" ? <Fx k="basket" cw={320} ch={260} draw={fxBasket} x={x} y={y} w={w} s={s} />
  : <Ico n={k} x={x} y={y} w={w} c={k === "crowd" ? RED : k === "crown" ? GOLD : "#c9ccd2"} c2={k === "crowd" ? "#3f6fb5" : GOLD} s={s} />;
const GRID: [number, number][] = [[520, 390], [1400, 390], [520, 730], [1400, 730]];

export const SCENES3: Record<string, Scene> = {
  // ================= 4 · LTCM =================
  l0: Title(PALS.ltcm, "4", "THE NOBEL WINNERS", "Long-Term Capital · 1998", (c) => <><Spot x={1700} y={640} w={560} h={900} op={0.2} /><Char {...PT[0]} x={1610} y={1000} h={600} f={c.f} expr="smile" s={pop(c.f, 8, 14)} /><Char {...PT[2]} x={1790} y={1000} h={600} f={c.f} expr="smile_closed" s={pop(c.f, 12, 14)} /></>),
  l1: (c) => {
    const p = PALS.ltcm, co = c.c("computers") - 4, ma = c.c("math") - 4, fi = c.c("figured") - 6;
    const fm = ["∑", "σ²", "∂V/∂t", "√t", "e⁻ʳᵗ", "N(d₁)"];
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={160} size={96}>The <Em c={TEAL}>1990s</Em></Head>
        <Ico n="computer" x={620} y={600} w={600} c="#d9dde0" c2="#12233b" s={pop(c.f, co, 14)} />
        {fm.map((t, i) => <T key={i} x={1180 + (i % 3) * 230} y={390 + Math.floor(i / 3) * 210 + 10 * Math.sin(c.f * 0.08 + i)} size={96} wt={700} color={i % 2 ? GOLD : TEAL} font='Georgia, "Times New Roman", serif' s={pop(c.f, ma + i * 3, 10)}>{t}</T>)}
        <T x={1410} y={860} size={72} color="#fff" s={pop(c.f, fi, 12)}>PROBLEM SOLVED?</T>
      </>
    );
  },
  l3: (c) => {
    const p = PALS.ltcm, sc = c.c("scholes") - 6, me = c.c("merton") - 6, no = c.c("nobel") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Team c={c} expr={(i) => (i === 2 ? "grin" : i % 2 ? "smile" : "smile_closed")} />
        <T x={690} y={945} size={36} color={TEAL} ls={2} op={fade(c.f, sc)}>MYRON SCHOLES</T>
        <T x={1230} y={945} size={36} color={TEAL} ls={2} op={fade(c.f, me)}>ROBERT MERTON</T>
        <T x={960} y={1010} size={30} wt={800} color="#fff" ls={2} op={0.7 * fade(c.f, 10)}>JOHN MERIWETHER</T>
        <Ico n="medal" x={690} y={300} w={150} c={GOLD} s={pop(c.f, no, 12)} /><Ico n="medal" x={1230} y={300} w={150} c={GOLD} s={pop(c.f, no + 4, 12)} />
        <T x={960} y={150} size={84} color={GOLD} s={pop(c.f, no + 6, 12)}>NOBEL PRIZE · 1997</T>
      </>
    );
  },
  l4: (c) => {
    const p = PALS.ltcm, id = c.c("identical") - 10, ga = c.c("gap") - 4, cl = c.c("close") - 6, pe = c.c("pennies") - 4;
    const u = c.f < cl ? lerp(0, 0.45, ease((c.f - id) / 40)) : lerp(0.45, 1, ease((c.f - cl) / 34));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={84}>The <Em c={TEAL}>boring</Em> strategy</Head>
        <Lines x0={300} x1={1500} y={560} u={u} gap={(t) => 150 * (1 - ease(t / 0.96))} />
        <T x={270} y={485} a="r" size={40} color={TEAL} op={fade(c.f, id)}>BOND A</T><T x={270} y={635} a="r" size={40} color={GOLD} op={fade(c.f, id)}>BOND B</T>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: fade(c.f, ga) }}><path d="M560 500 v-0 M548 496 h24 M548 624 h24 M560 496 v128" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></svg>
        <T x={590} y={760} size={46} color="#fff" op={fade(c.f, ga)}>THE GAP</T>
        <T x={1160} y={760} size={46} color={TEAL} op={fade(c.f, cl + 20)}>…CLOSES</T>
        <Fx k="coin0" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={1640} y={560} w={170} s={pop(c.f, pe, 12)} />
        <T x={1640} y={700} size={70} color={GOLD} s={pop(c.f, pe + 4, 12)}>+1¢</T>
      </>
    );
  },
  l5: (c) => {
    const p = PALS.ltcm, bo = c.c("borrow") - 4, lo = c.c("lot") - 4, n = clamp((c.f - bo) / 30) * 11;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Fx k="coin0" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={330} y={640} w={190} s={pop(c.f, 2, 12)} />
        <T x={330} y={800} size={48} color={GOLD} op={fade(c.f, 6)}>PENNIES</T>
        <T x={590} y={640} size={150} color="#fff" op={fade(c.f, bo)}>×</T>
        {Array.from({ length: 11 }, (_, i) => i < n ? <div key={i} style={{ position: "absolute", left: 760, top: 820 - i * 62, width: 520, height: 56, background: i % 2 ? "#8f97a8" : "#a5acbb", border: `5px solid ${INK}`, boxSizing: "border-box", borderRadius: 8, transform: `scale(${pop(c.f, bo + i * 2.7, 8)})` }} /> : null)}
        <T x={1020} y={930} size={44} color="#fff" ls={2} op={fade(c.f, bo + 10)}>BORROWED MONEY</T>
        <T x={1600} y={420} size={84} color={GOLD} s={pop(c.f, lo + 4, 12)}>{"=\nFORTUNES"}</T>
      </>
    );
  },
  l6: (c) => {
    const p = PALS.ltcm, cs = [c.c("twentyone") - 4, c.c("fortythree") - 4, c.c("fortyone") - 4], vs = [21, 43, 41], base = 850, K = 9.6;
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={88}>And it <Em c={TEAL}>works</Em></Head>
        <T x={960} y={250} size={36} wt={800} color="#fff" ls={3} op={0.7 * fade(c.f, 10)}>RETURN PER YEAR, AFTER FEES</T>
        <div style={{ position: "absolute", left: 300, right: 300, top: base, height: 6, background: "#fff", opacity: 0.5 }} />
        {vs.map((v, i) => { const g = out3((c.f - cs[i]) / 18), x = 560 + i * 400; return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x - 120, top: base - v * K * g, width: 240, height: v * K * g, background: i === 0 ? "#1fa583" : TEAL, border: `7px solid ${INK}`, boxSizing: "border-box", borderRadius: "16px 16px 0 0", opacity: c.f >= cs[i] ? 1 : 0 }} />
            <T x={x} y={base - v * K * g - 70} size={110} color="#fff" op={fade(c.f, cs[i] + 2)}>{Math.round(v * g) + "%"}</T>
            <T x={x} y={base + 60} size={42} color="#fff" ls={3} op={0.8}>{"YEAR " + (i + 1)}</T>
          </React.Fragment>); })}
      </>
    );
  },
  l7: (c) => {
    const p = PALS.ltcm, fv = c.c("five") - 6, hu = c.c("hundred") - 6, tf = c.c("twentyfive", 1) - 6, n = clamp((c.f - hu) / 50) * 25;
    return (
      <>
        <Bg p={p} f={c.f} floor={880} />
        <Tower x={560} n={n} own={pop(c.f, fv, 12)} />
        <T x={760} y={855} a="l" size={46} color={TEAL} op={fade(c.f, fv + 4)}>ITS OWN MONEY: $4.7 BILLION</T>
        <T x={760} y={600} a="l" size={46} color="#c9d0dd" op={fade(c.f, hu + 20)}>BORROWED: $125 BILLION</T>
        <T x={1440} y={250} size={220} color={GOLD} ls={-4} s={pop(c.f, tf, 12)}>25 : 1</T>
        <T x={1440} y={400} size={40} wt={800} color="#fff" op={0.85 * fade(c.f, tf + 10)}>{"more than $25 of debt\nfor every $1 it owns"}</T>
      </>
    );
  },
  l8: (c) => {
    const p = PALS.ltcm, fo = c.c("four") - 6, wi = c.c("wipes") - 6, k = clamp((c.f - fo) / 20), gone = c.f >= wi;
    return (
      <>
        <Bg p={p} f={c.f} floor={880} />
        <Tower x={860} n={25} cut={k > 0 ? 1 : 0} own={gone ? Math.max(0, 1 - (c.f - wi) / 10) : 1} ownCol={c.f >= fo ? RED : TEAL} />
        {k > 0 && k < 1 && <div style={{ position: "absolute", left: 690 + 260 * k, top: 176 + 520 * k * k, width: 340, height: 24, background: RED, border: `3px solid ${INK}`, boxSizing: "border-box", borderRadius: 4, transform: `rotate(${k * 50}deg)` }} />}
        <T x={1090} y={190} a="l" size={84} color={RED} s={pop(c.f, fo, 12)}>−4%</T>
        <T x={1090} y={290} a="l" size={38} wt={800} color="#fff" op={0.8 * fade(c.f, fo + 8)}>{"a small drop in\nwhat the fund owns…"}</T>
        <T x={1090} y={800} a="l" size={66} color={RED} s={pop(c.f, wi + 6, 12)}>{"…AND ITS OWN\nMONEY IS GONE"}</T>
        <Spot x={300} y={650} w={560} h={760} /><Shadow x={300} y={FLOOR} w={220} op={0.35} />
        <Char {...FI} x={300} y={FLOOR} h={500} f={c.f} expr="sad" look={1} />
        <Bubble x={320} y={330} s={pop(c.f, 6, 10)} w={380} size={38}>Remember my math?</Bubble>
      </>
    );
  },
  l9: (c) => {
    const p = PALS.ltcm, im = c.c("impossible") - 8, u = out3((c.f - 4) / 40);
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={84}>What the <Em c={TEAL}>models</Em> said</Head>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <clipPath id="bellclip"><rect x={300} y={200} width={1320 * u} height={700} /></clipPath>
          <g clipPath="url(#bellclip)"><polygon points={`300,820 ${bell(300, 1620, 820, 460)} 1620,820`} fill="rgba(43,217,168,0.18)" /><polyline points={bell(300, 1620, 820, 460)} fill="none" stroke={TEAL} strokeWidth={10} strokeLinejoin="round" /></g>
          <line x1={300} x2={1620} y1={820} y2={820} stroke="#fff" strokeWidth={5} opacity={0.5} />
          <text x={960} y={880} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={34} fill="#fff" opacity={0.7}>NORMAL DAYS</text>
          <text x={1500} y={880} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={34} fill="#fff" opacity={0.7}>BIG GAINS</text>
          <text x={420} y={880} textAnchor="middle" fontFamily="Inter Display, Inter" fontWeight={800} fontSize={34} fill="#fff" opacity={0.7}>BIG LOSSES</text>
        </svg>
        <div style={{ position: "absolute", left: 318, top: 792, width: 44, height: 44, borderRadius: 22, background: RED, border: `6px solid ${INK}`, boxSizing: "border-box", transform: `scale(${pop(c.f, im - 16, 10) * (1 + 0.15 * Math.sin(c.f * 0.4))})` }} />
        <Box x={560} y={600} w={560} h={150} bg={RED} s={pop(c.f, im, 12)} rot={-3}><T x={274} y={44} size={40} color="#fff">A LOSS LIKE THAT:</T><T x={274} y={100} size={46} color="#fff">“ALMOST IMPOSSIBLE”</T></Box>
      </>
    );
  },
  l10: (c) => {
    const p = PALS.ltcm, ru = c.c("russia") - 6, de = c.c("defaults") - 4, wi = c.c("wider") - 20, u = ease((c.f - wi) / 50);
    return (
      <>
        <Bg p={p} f={c.f} />
        <Fx k="globe" cw={240} ch={240} draw={fxGlobe} x={420} y={470} w={420} s={pop(c.f, 2, 14)} />
        <svg width={120} height={150} viewBox="0 0 120 150" style={{ position: "absolute", left: 470, top: 250, transform: `scale(${pop(c.f, ru, 10)})`, transformOrigin: "50% 100%" }}><path d="M60 146 q-48 -62 -48 -92 a48 48 0 0 1 96 0 q0 30 -48 92 z" fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" /><circle cx={60} cy={54} r={17} fill="#fff" stroke={INK} strokeWidth={6} /></svg>
        <T x={420} y={750} size={44} color="#fff" ls={2} op={fade(c.f, ru + 4)}>RUSSIA · AUGUST 1998</T>
        <Stamp t="DEFAULT" x={420} y={880} w={480} s={pop(c.f, de, 9)} rot={-5} />
        <Lines x0={900} x1={1760} y={520} u={clamp((c.f - 6) / 30 + u)} gap={(t) => 50 + 330 * u * ease(t * 1.3)} colB={u > 0.2 ? RED : GOLD} />
        <T x={1330} y={210} size={60} color={u > 0.2 ? RED : "#fff"} op={fade(c.f, 12)} s={1 + 0.25 * u}>{u > 0.2 ? "THE GAPS GET WIDER" : "THE GAPS"}</T>
        <T x={1330} y={880} size={44} wt={800} color="#fff" op={0.8 * fade(c.f, c.c("panic") - 4)}>investors everywhere rush to safety</T>
      </>
    );
  },
  l11: (c) => {
    const p = PALS.ltcm, lo = c.c("loses") - 4;
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={220} size={70} color={TEAL} ls={3} op={fade(c.f, 2)}>IN LESS THAN 4 MONTHS</T>
        {[0, 1, 2, 3].map((i) => <Box key={i} x={660 + i * 200} y={400} w={150} h={160} bg="#fff" r={14} s={pop(c.f, 6 + i * 5, 10)} op={i === 3 ? 0.55 : 1}><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 44, background: RED }} /><T x={69} y={92} size={70} color={INK}>{String(i + 1)}</T></Box>)}
        <T x={960} y={690} size={172} color={RED} ls={-4} op={fade(c.f, lo)}>{"−$" + fmt(count(c.f, lo, lo + 40, 0, 4600000000))}</T>
        <T x={960} y={850} size={46} wt={800} color="#fff" op={0.8 * fade(c.f, lo + 30)}>$4.6 billion</T>
      </>
    );
  },
  l13: (c) => {
    const p = PALS.ltcm, on = c.c("one") - 6, wi = c.c("wiped") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Team c={c} h={470} expr={(i) => (c.f < wi ? "nervous" : i % 2 ? "sad" : "pained")} />
        <T x={960} y={150} size={44} color={TEAL} ls={3} op={fade(c.f, on - 6)}>THE PARTNERS' OWN MONEY IN THE FUND</T>
        <T x={960} y={290} size={170} color={c.f >= wi ? RED : "#fff"} ls={-4} op={fade(c.f, on)}>{"$" + fmt(c.f < wi ? count(c.f, on, on + 26, 0, 1900000000) : count(c.f, wi, wi + 26, 1900000000, 0))}</T>
      </>
    );
  },
  l13b: (c) => {
    const p = PALS.ltcm, cl = c.c("closed") - 6, se = c.c("second") - 6, hi = c.c("hit") - 4, c2 = c.c("closes") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Ico n="door" x={520} y={610} w={520} c="#5a6072" c2="#12233b" s={pop(c.f, 2, 12)} />
        <T x={520} y={270} size={44} color="#fff" ls={2} op={fade(c.f, 6)}>LONG-TERM CAPITAL</T>
        <Stamp t="CLOSED 2000" x={520} y={600} w={520} s={pop(c.f, cl, 9)} rot={-7} />
        <Spot x={960} y={650} w={420} h={700} /><Shadow x={960} y={FLOOR} w={220} op={0.35} />
        <Char {...MW} x={960} y={FLOOR} h={500} f={c.f} expr={c.f < se ? "sad" : c.f < hi ? "smile" : "pained"} look={c.f >= se ? -1 : 0} />
        <Ico n="door" x={1400} y={610} w={520} c="#34446a" c2="#12233b" s={pop(c.f, se, 12)} />
        <T x={1400} y={270} size={44} color={TEAL} ls={2} op={fade(c.f, se + 6)}>A SECOND FUND</T>
        <Fx k="warn" cw={300} ch={270} draw={fxWarning} x={1680} y={430} w={190} s={pop(c.f, hi, 10)} />
        <T x={1680} y={560} size={38} color={GOLD} op={fade(c.f, hi + 4)}>2008 CRISIS</T>
        <Stamp t="CLOSED" x={1400} y={620} w={480} s={pop(c.f, c2, 9)} rot={6} />
      </>
    );
  },
  l14: (c) => {
    const p = PALS.ltcm, bo = c.c("book") - 6, tr = c.c("trusted") - 4, fg = c.c("forgot") - 4;
    return (
      <>
        <Bg p={p} f={c.f} />
        <Box x={520} y={540} w={460} h={640} bg="#123b3a" r={16} s={pop(c.f, bo, 14)} rot={-3}>
          <div style={{ position: "absolute", inset: 22, border: `5px solid ${GOLD}`, borderRadius: 8 }} />
          <T x={224} y={190} size={70} color={GOLD} ls={2}>WHEN</T><T x={224} y={290} size={84} color="#fff" ls={2}>GENIUS</T><T x={224} y={390} size={70} color={GOLD} ls={2}>FAILED</T>
        </Box>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: fade(c.f, tr) }}>
          <polyline points={bell(940, 1740, 720, 360)} fill="rgba(43,217,168,0.15)" stroke={TEAL} strokeWidth={10} strokeLinejoin="round" />
          <line x1={940} x2={1740} y1={720} y2={720} stroke="#fff" strokeWidth={5} opacity={0.5} />
          {c.f >= fg && <polyline points="1340,350 1300,440 1380,500 1310,590 1370,650 1330,720" fill="none" stroke={RED} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - out3((c.f - fg) / 10))} />}
        </svg>
        <T x={1340} y={250} size={56} color="#fff" ls={2} op={fade(c.f, tr)}>THE MODEL</T>
        <T x={1340} y={850} size={74} color={RED} s={pop(c.f, fg + 4, 12)}>…CAN BE WRONG</T>
      </>
    );
  },
  l15: Mistake(PALS.ltcm, 4, "OVER-\nCONFIDENCE", (c, s) => <Ico n="crown" x={1500} y={560} w={400} c={GOLD} s={s} />),

  // ================= THE PATTERN =================
  p0: Title(PALS.pattern, "", "THE PATTERN", "What four geniuses have in common", (c) => <>
    {[NW, TW, FI, PT[0]].map((w, i) => <Char key={i} {...w} x={1330 + i * 150} y={930} h={400} f={c.f} expr="neutral" s={pop(c.f, 8 + i * 4, 12)} />)}</>),
  p1: (c) => {
    const p = PALS.pattern, cs = [c.c("physicist") - 4, c.c("writer") - 4, c.c("economist") - 4, c.c("phds") - 10], ce = c.c("centuries") - 6;
    const who = [NW, TW, FI, MW], yrs = ["1720", "1894", "1929", "1998"], xs = [330, 750, 1170, 1590];
    return (
      <>
        <Bg p={p} f={c.f} />
        <div style={{ position: "absolute", left: 160, top: 700, height: 10, width: 1600 * out3(c.f / 24), background: "rgba(255,255,255,0.35)", borderRadius: 5 }} />
        {xs.map((x, i) => (
          <React.Fragment key={i}>
            <Spot x={x} y={480} w={420} h={560} />
            <Char {...who[i]} x={x} y={690} h={470} f={c.f} expr="neutral" s={pop(c.f, cs[i], 12)} />
            {i === 3 && <><Char {...PT[0]} x={x - 130} y={690} h={380} f={c.f} expr="neutral" s={pop(c.f, cs[i] + 3, 12)} /><Char {...PT[2]} x={x + 130} y={690} h={380} f={c.f} expr="neutral" s={pop(c.f, cs[i] + 6, 12)} /></>}
            <div style={{ position: "absolute", left: x - 20, top: 685, width: 40, height: 40, borderRadius: 20, background: GOLD, border: `6px solid ${INK}`, boxSizing: "border-box", transform: `scale(${pop(c.f, cs[i], 10)})` }} />
            <T x={x} y={790} size={76} color="#fff" op={fade(c.f, cs[i] + 4)}>{yrs[i]}</T>
          </React.Fragment>
        ))}
        <T x={960} y={150} size={90} color={GOLD} s={pop(c.f, ce, 12)}>3 CENTURIES</T>
        <T x={960} y={930} size={56} color={TEAL} ls={2} op={fade(c.f, c.c("look") - 4)}>WHAT DO THEY SHARE?</T>
      </>
    );
  },
  p2: (c) => {
    const p = PALS.pattern, st = c.c("stupid") - 6, sm = c.c("smart") - 4, su = c.c("sure") - 6;
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={280} size={150} color="rgba(255,255,255,0.55)" op={fade(c.f, st)} ls={-2}>STUPID?</T>
        <div style={{ position: "absolute", left: 620, top: 274, height: 16, width: 680 * out3((c.f - st - 12) / 10), background: RED, borderRadius: 8, transform: "rotate(-4deg)" }} />
        <T x={960} y={540} size={260} color={GOLD} s={pop(c.f, sm, 12)} ls={-5}>SMART.</T>
        <T x={960} y={820} size={84} color="#fff" op={fade(c.f, su - 14)}>Smart enough to feel <Em c={TEAL}>sure</Em>.</T>
      </>
    );
  },
  p3: (c) => {
    const p = PALS.pattern, cs = [c.c("newton") - 4, c.c("twain") - 4, c.c("fisher") - 4, c.c("longterm") - 6], who = [NW, TW, FI, MW], names = ["NEWTON", "TWAIN", "FISHER", "LONG-TERM CAPITAL"];
    return (
      <>
        <Bg p={p} f={c.f} />
        {cs.map((a, i) => { const y = 190 + i * 215, k = slide(c.f, a, 14); return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: 200 - 80 * (1 - k), top: y - 92, width: 1520, height: 184, borderRadius: 28, background: "rgba(255,255,255,0.07)", border: "4px solid rgba(255,255,255,0.16)", boxSizing: "border-box", opacity: fade(c.f, a) }} />
            <div style={{ position: "absolute", left: 230, top: y - 80, width: 170, height: 160, overflow: "hidden", opacity: fade(c.f, a) }}><Char {...who[i]} x={85} y={330} h={400} f={c.f} expr={i === 3 ? "nervous" : "sad"} still /></div>
            <T x={440} y={y - 38} a="l" size={38} color={TEAL} ls={3} op={fade(c.f, a + 2)}>{names[i]}</T>
            <T x={440} y={y + 28} a="l" size={70} color="#fff" op={fade(c.f, a + 4)}>{MIS[i][3]}</T>
            <MisIcon k={MIS[i][0]} x={1600} y={y} w={130} s={pop(c.f, a + 8, 10)} />
          </React.Fragment>); })}
      </>
    );
  },
  p4: (c) => {
    const p = PALS.pattern, cs = [c.c("crowd") - 4, c.c("basket") - 6, c.c("leverage") - 4, c.c("overconfidence") - 4], al = c.c("almost") - 4;
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={110} size={64} color={TEAL} ls={5} op={fade(c.f, 0)}>THE 4 MISTAKES</T>
        {GRID.map(([x, y], i) => (
          <React.Fragment key={i}>
            <Box x={x} y={y} w={800} h={300} bg="rgba(255,255,255,0.08)" bd="rgba(255,255,255,0.2)" bw={5} r={32} s={pop(c.f, cs[i], 12)} shadow={false} />
            <MisIcon k={MIS[i][0]} x={x - 250} y={y} w={210} s={pop(c.f, cs[i] + 3, 12)} />
            <T x={x - 110} y={y} a="l" size={MIS[i][1].length > 12 ? 52 : 66} color="#fff" op={fade(c.f, cs[i] + 4)}>{MIS[i][1]}</T>
            <T x={x - 340} y={y - 100} size={50} color={GOLD} op={fade(c.f, cs[i] + 4)}>{String(i + 1)}</T>
          </React.Fragment>
        ))}
        <T x={960} y={980} size={50} color="#fff" op={fade(c.f, al)}>behind almost <Em c={GOLD}>every investing disaster</Em> in history</T>
      </>
    );
  },
  p4b: (c) => {
    const p = PALS.pattern, cs = [c.c("crowd") - 4, c.c("basket") - 6, c.c("leverage") - 4, c.c("overconfidence") - 4];
    const cur = cs.reduce((k, a, i) => (c.f >= a ? i : k), -1);
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={110} size={64} color={GOLD} ls={5} op={fade(c.f, 0)}>STILL TRUE TODAY</T>
        {GRID.map(([x, y], i) => { const on = cur === i, seen = c.f >= cs[i]; return (
          <React.Fragment key={i}>
            <Box x={x} y={y} w={800} h={300} bg={on ? "rgba(43,217,168,0.16)" : "rgba(255,255,255,0.08)"} bd={on ? TEAL : "rgba(255,255,255,0.2)"} bw={on ? 8 : 5} r={32} s={on ? 1.03 : 1} shadow={false} />
            <MisIcon k={MIS[i][0]} x={x - 280} y={y} w={150} />
            <T x={x - 180} y={y - 86} a="l" size={36} color={TEAL} ls={3}>{MIS[i][1]}</T>
            <T x={x - 180} y={y + 24} a="l" size={i >= 2 ? 54 : 40} color="#fff" op={seen ? 1 : 0.0} lh={1.15}>{MIS[i][2]}</T>
          </React.Fragment>); })}
      </>
    );
  },
  p5: (c) => {
    const p = PALS.pattern, me = c.c("meet") - 6, mi = c.c("millionaire") - 10;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <T x={960} y={170} size={84} color="#fff" op={fade(c.f, 2)}>What does the <Em c={TEAL}>opposite</Em> look like?</T>
        <T x={960} y={520} size={420} color={GOLD} op={c.f < me ? fade(c.f, 6) : Math.max(0, 1 - (c.f - me) / 8)} s={0.7 + 0.3 * pop(c.f, 6, 12)}>?</T>
        <Spot x={960} y={620} w={700} h={760} op={0.2 * fade(c.f, me)} />
        <Char {...RR} x={960} y={FLOOR} h={640} f={c.f} prop="mop" expr="smile_closed" sil="#000" s={pop(c.f, me, 12)} />
        <T x={960} y={960} size={58} color={GOLD} ls={2} s={pop(c.f, mi, 12)}>THE LEAST LIKELY MILLIONAIRE IN AMERICA</T>
      </>
    );
  },

  // ================= THE JANITOR =================
  r0: Title(PALS.read, "", "THE JANITOR", "Ronald Read · Brattleboro, Vermont", (c) => <Char {...RR} x={1560} y={1010} h={820} f={c.f} expr="smile" prop="mop" s={pop(c.f, 8, 14)} />),
  r2: (c) => {
    const p = PALS.read, cs = [c.c("car") - 6, c.c("pin") - 10, c.c("stranger") - 6];
    const cards: [string, string][] = [["car", "A USED CAR"], ["pin", "A SAFETY PIN\nINSTEAD OF A BUTTON"], ["bf", "A STRANGER PAID\nFOR HIS BREAKFAST"]];
    return (
      <>
        <Bg p={p} f={c.f} />
        {cards.map(([k, label], i) => { const x = 380 + i * 580, s = pop(c.f, cs[i], 12); return (
          <React.Fragment key={i}>
            <Box x={x} y={560} w={500} h={640} bg="#FBF9F0" s={s} rot={[-2, 1.5, -1][i]} />
            {k === "bf" ? <Fx k="bf" cw={320} ch={200} draw={fxBreakfast} x={x} y={470} w={380} s={s} /> : <Ico n={k} x={x} y={470} w={340} c={k === "car" ? "#5f9aa0" : "#c9ccd2"} c2="#cfe6ea" s={s} />}
            <T x={x} y={760} size={34} color={p.ink} ls={1} op={fade(c.f, cs[i] + 6)} lh={1.2}>{label}</T>
          </React.Fragment>); })}
      </>
    );
  },
  r3: (c) => {
    const p = PALS.read, ei = c.c("eight") - 6, fi = c.c("finds") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={360} y={FLOOR} w={260} /><Char {...RR} x={360} y={FLOOR} h={620} f={c.f} expr="smile_closed" prop="mop" />
        <T x={1140} y={210} size={48} color={p.ink} ls={3} op={fade(c.f, 4)}>2014 · AGE 92</T>
        <T x={1140} y={420} size={230} color={p.acc} ls={-6} op={fade(c.f, ei)}>{"$" + fmt(count(c.f, ei, ei + 36, 0, 8000000))}</T>
        <T x={1140} y={555} size={44} wt={800} color={p.ink} op={0.8 * fade(c.f, ei + 20)}>almost — and nobody knew</T>
        {[0, 1, 2].map((i) => <React.Fragment key={i}><Shadow x={900 + i * 250} y={FLOOR} w={190} op={0.2 * fade(c.f, fi + i * 3)} /><Char o={townie([2, 5, 8][i])} ok={"townie" + [2, 5, 8][i]} id={50 + i} x={900 + i * 250} y={FLOOR} h={340} f={c.f} expr="shock" look={-1} s={pop(c.f, fi + i * 3, 12)} /></React.Fragment>)}
      </>
    );
  },
  r4: (c) => {
    const p = PALS.read, no = [c.c("formulas") - 6, c.c("borrowed") - 6, c.c("tips") - 8], ok = [c.c("soap") - 4, c.c("medicine") - 4, c.c("electricity") - 4], nf = c.c("ninetyfive") - 16;
    const cols = ["#4D6B3C", "#C8862B", "#3f6fb5", "#8fb65a", "#b5653f", "#2f7f86"], k = clamp((c.f - nf) / 46) * 95;
    return (
      <>
        <Bg p={p} f={c.f} />
        {[0, 1, 2].map((i) => { const x = 250 + i * 250; return (
          <React.Fragment key={i}>
            {i === 0 ? <Fx k="int" cw={300} ch={300} draw={fxIntegral} x={x} y={270} w={170} s={pop(c.f, no[i], 10)} /> : i === 1 ? <Fx k="bag" cw={300} ch={300} draw={fxBag} x={x} y={270} w={190} s={pop(c.f, no[i], 10)} /> : <Ico n="flame" x={x} y={270} w={170} c="#f08a2c" s={pop(c.f, no[i], 10)} />}
            <Ico n="cross" x={x + 60} y={210} w={90} c={RED} s={pop(c.f, no[i] + 6, 9)} />
            <T x={x} y={400} size={30} color={p.ink} ls={1} op={fade(c.f, no[i] + 4)}>{["NO FORMULAS", "NO BORROWING", "NO HOT TIPS"][i]}</T>
          </React.Fragment>); })}
        {[fxSoap, fxPill, fxBulb].map((d, i) => <React.Fragment key={i}><Fx k={"ok" + i} cw={[240, 300, 260][i]} ch={[300, 160, 300][i]} draw={d} x={1180 + i * 240} y={270} w={[150, 190, 150][i]} s={pop(c.f, ok[i], 10)} /><T x={1180 + i * 240} y={400} size={30} color={p.acc} ls={1} op={fade(c.f, ok[i] + 4)}>{["SOAP", "MEDICINE", "ELECTRICITY"][i]}</T></React.Fragment>)}
        {Array.from({ length: 95 }, (_, i) => i < k ? <div key={i} style={{ position: "absolute", left: 208 + (i % 19) * 80, top: 500 + Math.floor(i / 19) * 78, width: 66, height: 62, borderRadius: 12, background: cols[(i * 7) % 6], border: `4px solid ${INK}`, boxSizing: "border-box", transform: `scale(${pop(c.f, nf + (i / 95) * 46, 7)})` }} /> : null)}
        <T x={960} y={960} size={64} color={p.ink} op={fade(c.f, nf + 10)}>{"AT LEAST " + Math.round(Math.min(95, k)) + " COMPANIES"}</T>
      </>
    );
  },
  r5: (c) => {
    const p = PALS.read, re = c.c("reinvested") - 4, fi = c.c("fifty") - 6;
    const grow: Pt[] = Array.from({ length: 12 }, (_, i) => [1959 + i * 5, Math.exp(i * 0.42)] as Pt);
    const up = lerp(1959, 2014, ease((c.f - 6) / Math.max(60, fi + 10)));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={80} x={760}>Reinvest. <Em c={p.acc}>Hold.</Em> Repeat.</Head>
        <Chart x={220} y={280} w={1080} h={560} pts={grow} x0={1959} x1={2016} y0={0} y1={110} upTo={up} color={p.acc} ink={p.ink} soft="rgba(38,50,31,0.12)" xl={[[1959, "1959"], [1980, "1980"], [2000, "2000"], [2014, "2014"]]} yl={[[25, ""], [50, ""], [75, ""], [100, ""]]} />
        {[0, 1, 2, 3, 4, 5].map((i) => { const u = ((c.f - re) / 40 + i / 6) % 1; return c.f >= re ? <Fx key={i} k="coin0" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={500 + i * 120} y={lerp(300, 720 - i * 40, u * u)} w={70} op={1 - u * u} /> : null; })}
        <T x={640} y={262} size={40} color={p.acc2} ls={2} op={fade(c.f, re + 6)}>DIVIDENDS GO BACK IN</T>
        <T x={1600} y={420} size={190} color={p.acc} ls={-4} s={pop(c.f, fi, 12)}>50+</T>
        <T x={1600} y={560} size={60} color={p.ink} ls={4} op={fade(c.f, fi + 6)}>YEARS</T>
        <Char {...RR} x={1600} y={1010} h={420} f={c.f} expr="smile_closed" still />
      </>
    );
  },
  r5b: (c) => {
    const p = PALS.read, op = c.c("opened") - 6, fv = c.c("five") - 6, n = Math.round(2 + 10 * ease((c.f - op) / 40));
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Ico n="safebox" x={520} y={640} w={520} c="#9aa3ad" c2="#c9ccd2" s={pop(c.f, 2, 14)} />
        <T x={520} y={950} size={40} color={p.ink} ls={2} op={fade(c.f, 8)}>SAFE DEPOSIT BOX</T>
        {c.f >= op && <Fx k={"stack" + n} cw={300} ch={400} draw={(q) => fxStack(q, n)} x={1060} y={600} w={480} />}
        <T x={1060} y={950} size={40} color={p.ink} ls={2} op={fade(c.f, op + 6)}>STOCK CERTIFICATES</T>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: fade(c.f, fv) }}><path d="M1370 470 v330 M1346 470 h48 M1346 800 h48" fill="none" stroke={p.acc2} strokeWidth={10} strokeLinecap="round" /></svg>
        <T x={1420} y={635} a="l" size={76} color={p.acc2} s={pop(c.f, fv, 12)}>{"5 INCHES\nTHICK"}</T>
      </>
    );
  },
  r6: (c) => {
    const p = PALS.read, q = [c.c("crowd") - 4, c.c("basket") - 6, c.c("leverage") - 4, c.c("overconfidence") - 4], a = [c.c("ignored") - 4, c.c("ninetyfive") - 6, c.c("none") - 4, c.c("never") - 4];
    const ans = ["ignored it", "95 of them", "none", "never tried to outsmart anyone"];
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={780} y={130} size={64} color={p.ink} ls={3} op={fade(c.f, 0)}>THE 4 MISTAKES · RONALD READ</T>
        {q.map((qa, i) => { const y = 290 + i * 180; return (
          <React.Fragment key={i}>
            <Box x={780} y={y} w={1320} h={150} bg={c.f >= a[i] ? "#FBF9F0" : "rgba(38,50,31,0.08)"} bd={c.f >= a[i] ? p.acc : "rgba(38,50,31,0.25)"} r={28} s={pop(c.f, qa, 12)} shadow={false} />
            <T x={170} y={y} a="l" size={50} color={p.ink} op={fade(c.f, qa + 3)}>{MIS[i][1]}</T>
            <T x={700} y={y} a="l" size={i === 3 ? 40 : 50} color={p.acc} op={fade(c.f, a[i])}>{ans[i]}</T>
            <Ico n="check" x={1370} y={y} w={100} c={GREEN} s={pop(c.f, a[i] + 3, 10)} />
          </React.Fragment>); })}
        <Char {...RR} x={1700} y={1000} h={560} f={c.f} expr={c.f >= a[3] ? "smile" : "smile_closed"} />
      </>
    );
  },
  r7: (c) => {
    const p = PALS.read, ho = c.c("hospital") - 6, li = c.c("library") - 6, la = c.c("largest") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} a={c.c("six") - 6} y={140} size={92}><Em c={p.acc}>$6 million</Em> to his town</Head>
        <Ico n="hospital" x={560} y={590} w={440} c="#FBF9F0" c2="#9CC9D6" s={pop(c.f, ho, 14)} />
        <T x={560} y={330} size={84} color={p.acc} s={pop(c.f, ho + 6, 12)}>$4.8 MILLION</T>
        <T x={560} y={880} size={40} color={p.ink} ls={2} op={fade(c.f, ho + 4)}>THE HOSPITAL</T>
        <Ico n="library" x={1360} y={590} w={440} c="#FBF9F0" c2="#C8862B" s={pop(c.f, li, 14)} />
        <T x={1360} y={330} size={84} color={p.acc} s={pop(c.f, li + 6, 12)}>$1.2 MILLION</T>
        <T x={1360} y={880} size={40} color={p.ink} ls={2} op={fade(c.f, li + 4)}>THE LIBRARY</T>
        <Box x={960} y={1000} w={1180} h={100} bg={p.acc} r={50} s={pop(c.f, la, 12)}><T x={584} y={44} size={44} color="#fff" ls={2}>THE LARGEST GIFTS EITHER HAD EVER RECEIVED</T></Box>
      </>
    );
  },
  r10: (c) => {
    const p = PALS.hook, su = c.c("subscribe") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={900} />
        <T x={960} y={250 + 30 * (1 - slide(c.f, 0))} size={190} color="#fff" op={fade(c.f, 0)} ls={-4}>VACKO</T>
        <T x={960} y={400} size={76} color={TEAL} ls={10} op={fade(c.f, 6)}>MONEY STORIES</T>
        <Box x={960} y={590} w={560} h={140} bg={RED} bd={INK} r={70} s={pop(c.f, su, 12) * (1 + 0.03 * Math.sin(c.f * 0.25))}><T x={274} y={62} size={72} color="#fff" ls={3}>SUBSCRIBE</T></Box>
        <T x={960} y={760} size={46} wt={800} color="#fff" op={0.85 * fade(c.f, su + 14)}>The next true money story is on its way.</T>
        <Shadow x={330} y={900} w={240} op={0.4} /><Char {...NW} x={330} y={900} h={520} f={c.f} expr="smile" look={1} wave={Math.sin(c.f * 0.25)} />
        <Shadow x={1590} y={900} w={240} op={0.4} /><Char {...RR} x={1590} y={900} h={520} f={c.f} expr="smile" look={-1} wave={Math.sin(c.f * 0.25 + 1)} />
      </>
    );
  },
};
