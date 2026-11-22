// Scenes for chapter 2 (Mark Twain) and chapter 3 (Irving Fisher).
import React from "react";
import { Ctx, PALS, Bg, Char, Fx, T, Box, Ico, Chart, Flag, Shadow, Pt, pop, fade, slide, ease, out3, clamp, lerp, count, fmt, hh, INK, TEAL, GOLD, RED, GREEN } from "./kit";
import { Scene, FLOOR, Head, Em, Title, Mistake, NW, Bubble } from "./scenes";
import { TWAIN_O, FISHER_O, FOUNDER, townsfolk, Outfit, fxCoin, fxBag, fxPaper, fxBook, fxStamp, fxBadge, fxQuestion, fxBasket, fxBulb, fxCash, fxHouse, fxPuff } from "../toon";

export const TW = { o: TWAIN_O, ok: "twain", id: 8 }, FI = { o: FISHER_O, ok: "fisher", id: 9 };
const PAIGE = { o: FOUNDER(1), ok: "paige", id: 12 };
const YOUNG: Outfit = { jacket: "#8a5a3c", pants: "#4a4036", boots: "#3a2a22", hat: "hair", hair: "#a0522d", skin: "#f5d2b3", buttons: "#c9b89a", build: "kid" };
export const Stamp: React.FC<{ t: string; col?: string; x: number; y: number; w: number; s: number; rot?: number }> = ({ t, col = "#d42f2f", x, y, w, s, rot = 0 }) =>
  <Fx k={"stamp" + t + col} cw={520} ch={200} draw={(q) => fxStamp(q, t, col)} x={x} y={y} w={w} s={s} rot={rot} />;
export const Badge: React.FC<{ t: string; bg?: string; fg?: string; x: number; y: number; w: number; s: number }> = ({ t, bg = "#0B1E3A", fg = GOLD, x, y, w, s }) =>
  <Box x={x} y={y} w={w} h={w * 0.27} bg={bg} r={w * 0.135} s={s}><T x={w / 2 - 6} y={w * 0.135 - 6} size={Math.min(w * 0.17, (w * 1.42) / t.length)} color={fg} ls={1}>{t}</T></Box>;
/** an arrow from (x0, y) to (x1, y) that grows with u */
export const Arrow: React.FC<{ x0: number; x1: number; y: number; u: number; col?: string }> = ({ x0, x1, y, u, col = INK }) => (u <= 0 ? null : (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
    <line x1={x0} y1={y} x2={lerp(x0, x1, u) - 14} y2={y} stroke={col} strokeWidth={12} strokeLinecap="round" />
    <path d={`M${lerp(x0, x1, u) - 34} ${y - 26} L${lerp(x0, x1, u)} ${y} L${lerp(x0, x1, u) - 34} ${y + 26}`} fill="none" stroke={col} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
/** money bags (or anything) flying on an arc from A to B, one per start frame */
const Fly: React.FC<{ f: number; starts: number[]; ax: number; ay: number; bx: number; by: number; w?: number; d?: number }> = ({ f, starts, ax, ay, bx, by, w = 120, d = 22 }) => <>
  {starts.map((a, i) => { const u = (f - a) / d; return u > 0 && u < 1 ? <Fx key={i} k="bag" cw={300} ch={300} draw={fxBag} x={lerp(ax, bx, u)} y={lerp(ay, by, u) - 240 * Math.sin(Math.PI * u)} w={w} rot={u * 40} /> : null; })}
</>;
const MACH = { c: "#8f8478", c2: "#5a6072" };
// Dow Jones Industrial Average, schematic through well-known levels
const DOW20: Pt[] = [[1921.6, 64], [1923, 100], [1924.4, 92], [1925.95, 157], [1926.95, 157], [1927.95, 200], [1928.95, 300], [1929.67, 381]];
const DOW30: Pt[] = [[1929.67, 381], [1929.87, 199], [1930.29, 294], [1930.95, 165], [1931.95, 78], [1932.52, 41]];

export const SCENES2: Record<string, Scene> = {
  // ================= 2 · TWAIN =================
  t0: Title(PALS.twain, "2", "THE WRITER", "Mark Twain · Hartford, 1880", (c) => <Char {...TW} x={1660} y={1010} h={820} f={c.f} expr="smile" s={pop(c.f, 8, 14)} />),
  t2: (c) => {
    const p = PALS.twain, wr = c.c("writing") - 4, iv = c.c("inventions") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={960} y={FLOOR} w={260} />
        <Char {...TW} x={960} y={FLOOR} h={600} f={c.f} expr={c.f < iv ? "smile" : "grin"} look={c.f < iv ? -1 : 1} />
        <Fx k="bookR" cw={220} ch={280} draw={(q) => fxBook(q, "#b5343c")} x={420} y={520} w={200} s={pop(c.f, wr, 12)} rot={-8} />
        <Fx k="bookB" cw={220} ch={280} draw={(q) => fxBook(q, "#3f6fb5")} x={580} y={560} w={200} s={pop(c.f, wr + 4, 12)} rot={6} />
        <T x={500} y={770} size={46} color={p.ink} ls={3} op={fade(c.f, wr + 8)}>WRITING</T>
        <Ico n="gear" x={1380} y={470} w={210} c="#c9ccd2" s={pop(c.f, iv, 12)} rot={c.f * 1.5} />
        <Ico n="gear" x={1530} y={590} w={150} c={p.acc} s={pop(c.f, iv + 4, 12)} rot={-c.f * 2} />
        <Fx k="bulb" cw={260} ch={300} draw={fxBulb} x={1620} y={400} w={170} s={pop(c.f, iv + 8, 12)} />
        <T x={1480} y={770} size={46} color={p.acc} ls={3} op={fade(c.f, iv + 8)}>NEW INVENTIONS</T>
        <Ico n="heart" x={1220} y={330} w={120} c={RED} s={pop(c.f, iv + 14, 10) * (1 + 0.06 * Math.sin(c.f * 0.4))} />
      </>
    );
  },
  t3: (c) => {
    const p = PALS.twain, of = c.c("offered") - 4, no = c.c("no") - 3, te = c.c("telephone") - 6, rev = c.f >= te;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={420} y={FLOOR} w={260} />
        <Char {...TW} x={420} y={FLOOR} h={600} f={c.f} expr={rev ? "pained" : c.f >= no ? "stern" : "neutral"} look={1} />
        <Box x={1120} y={540} w={420} h={420} bg={rev ? "#FBF6E9" : "#8a6a4a"} s={pop(c.f, of, 12) * (rev ? 0.9 + 0.1 * pop(c.f, te, 10) : 1)} />
        {!rev && <Fx k="q" cw={300} ch={300} draw={fxQuestion} x={1120} y={540} w={240} s={pop(c.f, of + 4, 12)} />}
        {rev && <Ico n="phone" x={1120} y={540} w={340} c="#8a5a3c" s={pop(c.f, te, 12)} />}
        <Fx k="paper" cw={220} ch={280} draw={(q) => fxPaper(q, 0)} x={770} y={500} w={150} s={pop(c.f, of + 10, 12)} rot={-10} />
        <T x={770} y={640} size={36} color={p.ink} ls={2} op={fade(c.f, of + 14)}>STOCK OFFER</T>
        <Stamp t="NO" x={1120} y={520} w={470} s={rev ? 0 : pop(c.f, no, 9)} rot={-6} />
        <T x={1120} y={830} size={64} color={p.acc} s={pop(c.f, te + 4, 12)}>THE TELEPHONE</T>
        <Stamp t="HE SAID NO" x={1560} y={330} w={420} s={pop(c.f, te + 12, 10)} rot={8} />
      </>
    );
  },
  t4: (c) => {
    const p = PALS.twain, pa = c.c("paige") - 4, ma = c.c("machine") - 4, au = c.c("automatically") - 4, fa = c.c("faster") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={300} y={FLOOR} w={240} /><Char {...TW} x={300} y={FLOOR} h={540} f={c.f} expr="smile" look={1} />
        <Shadow x={640} y={FLOOR} w={240} op={0.2 * fade(c.f, pa)} /><Char {...PAIGE} x={640} y={FLOOR} h={540} f={c.f} expr="grin" look={1} s={pop(c.f, pa, 12)} prop={c.f > ma ? "paper" : null} />
        <T x={640} y={950} size={38} color={p.ink} ls={2} op={fade(c.f, pa + 6)}>JAMES PAIGE · INVENTOR</T>
        <Ico n="machine" x={1350} y={600} w={600} c={MACH.c} c2={MACH.c2} s={pop(c.f, ma, 14)} />
        <T x={1350} y={950} size={38} color={p.acc} ls={2} op={fade(c.f, ma + 8)}>THE PAIGE COMPOSITOR</T>
        {"TYPE".split("").map((ch, i) => { const a = au + i * 5, u = clamp((c.f - a) / 14); return <Box key={i} x={1180 + i * 115} y={lerp(520, 300, out3(u))} w={96} h={110} bg="#FBF6E9" r={12} s={pop(c.f, a, 10)}><T x={42} y={50} size={70} color={INK}>{ch}</T></Box>; })}
        <T x={1350} y={170} size={66} color={p.acc2} s={pop(c.f, fa, 12)}>FASTER THAN ANY HUMAN</T>
      </>
    );
  },
  t5: (c) => {
    const p = PALS.twain, ha = c.c("hand") - 10, ev = c.c("every") - 4, word = "TWAIN";
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={300} y={FLOOR} w={200} /><Char o={YOUNG} ok="young" id={13} x={300} y={FLOOR} h={470} f={c.f} expr="smile" look={1} />
        <T x={300} y={950} size={36} color={p.ink} ls={2}>THE APPRENTICE</T>
        <Box x={700} y={650} w={470} h={130} bg="#7a5a34" r={10} op={fade(c.f, 4)} />
        {word.split("").map((ch, i) => <Box key={i} x={530 + i * 85} y={640} w={74} h={92} bg="#d9dde0" r={8} bw={5} s={pop(c.f, ha + i * 9, 9)} shadow={false}><T x={32} y={41} size={54} color={INK}>{ch}</T></Box>)}
        <T x={700} y={520} size={44} color={p.acc} ls={2} op={fade(c.f, ha)}>SETTING TYPE BY HAND</T>
        {Array.from({ length: 12 }, (_, i) => <Ico key={i} n="news" x={1150 + (i % 4) * 170} y={330 + Math.floor(i / 4) * 190} w={150} c="#FBF6E9" s={pop(c.f, ev + i * 2, 10)} rot={(hh(i, 3) - 0.5) * 14} />)}
        <T x={1405} y={900} size={50} color={p.acc2} s={pop(c.f, ev + 20, 12)}>EVERY NEWSPAPER ON EARTH</T>
      </>
    );
  },
  t5b: (c) => {
    const p = PALS.twain, gr = c.c("grant") - 16, be = c.c("bestseller") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={420} y={FLOOR} w={260} /><Char {...TW} x={420} y={FLOOR} h={600} f={c.f} expr={c.f < be ? "smile" : "grin"} look={1} prop={c.f >= be ? "bags" : null} />
        <Box x={1150} y={520} w={420} h={560} bg="#23375c" r={16} s={pop(c.f, gr, 14)} rot={-3}>
          <div style={{ position: "absolute", inset: 22, border: `5px solid ${GOLD}`, borderRadius: 8 }} />
          <T x={204} y={150} size={44} color={GOLD} ls={3}>PERSONAL</T><T x={204} y={215} size={64} color={GOLD} ls={2}>MEMOIRS</T>
          <T x={204} y={330} size={36} wt={800} color="#fff" ls={2}>OF</T><T x={204} y={410} size={50} color="#fff" ls={1}>U. S. GRANT</T>
        </Box>
        <T x={1150} y={870} size={36} color={p.ink} ls={2} op={fade(c.f, gr + 10)}>PUBLISHED BY TWAIN'S OWN COMPANY</T>
        <Stamp t="BESTSELLER" col="#2E8B4A" x={1500} y={300} w={520} s={pop(c.f, be, 10)} rot={10} />
        {Array.from({ length: 12 }, (_, i) => { const u = ((c.f - be) / 34 + i / 12) % 1; return c.f > be + (i / 12) * 34 ? <Fx key={i} k="coin0" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={760 + hh(i, 2) * 1000} y={lerp(-60, 900, u)} w={76} /> : null; })}
      </>
    );
  },
  t6: (c) => {
    const p = PALS.twain, a1 = c.c("invests") - 2, a2 = c.c("invests", 1) - 2, a3 = c.c("again", 1) - 2, fo = c.c("fourteen") - 6;
    const starts = [a1, a2, a3, a3 + 14, a3 + 26, a3 + 38, a3 + 50, a3 + 62], yr = Math.round(count(c.f, fo - 20, fo + 44, 1880, 1894));
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={380} y={FLOOR} w={260} /><Char {...TW} x={380} y={FLOOR} h={600} f={c.f} expr={c.f < a3 ? "smile" : c.f < fo ? "neutral" : "nervous"} look={1} />
        <Ico n="machine" x={1400} y={640} w={560} c={MACH.c} c2={MACH.c2} rot={starts.some((a) => c.f > a + 20 && c.f < a + 26) ? 2 : 0} />
        <Fly f={c.f} starts={starts} ax={520} ay={560} bx={1300} by={560} />
        <T x={960} y={190} size={170} color={p.ink} ls={-3} op={fade(c.f, a1 + 6)}>{String(yr)}</T>
        <T x={960} y={330} size={60} color={p.acc} ls={4} s={pop(c.f, fo + 8, 12)}>14 YEARS</T>
      </>
    );
  },
  t7: (c) => {
    const p = PALS.twain, ei = c.c("eighteen") - 4, br = c.c("breaking") - 4, ap = c.c("apart") - 4, al = c.c("almost") - 6;
    const sh = c.f >= br ? 5 * Math.sin(c.f * 1.9) : 0;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} y={150} size={84} x={640}>Just one <Em c={p.acc}>problem</Em></Head>
        <Ico n="machine" x={760 + sh} y={600} w={640} c={MACH.c} c2={MACH.c2} rot={c.f >= br ? 1.5 * Math.sin(c.f * 1.3) : 0} />
        {[0, 1, 2].map((i) => { const u = ((c.f - br) / 36 + i / 3) % 1; return c.f >= br ? <Fx key={i} k={"puff" + Math.round(u * 12)} cw={300} ch={300} draw={(q) => fxPuff(q, Math.round(u * 12) / 12)} x={620 + i * 150} y={400 - u * 160} w={180 + u * 80} op={1 - u} /> : null; })}
        {[0, 1, 2, 3, 4].map((i) => { const u = clamp((c.f - ap - i * 3) / 26), an = -2.4 + i * 0.5; return u > 0 ? <Ico key={i} n="gear" x={760 + Math.cos(an) * 430 * out3(u)} y={560 + Math.sin(an) * 330 * out3(u) + 200 * u * u} w={90} c="#c9ccd2" rot={u * 300} /> : null; })}
        <T x={1470} y={330} size={150} color={p.ink} ls={-3} op={fade(c.f, ei)}>{fmt(count(c.f, ei, ei + 30, 0, 18000))}</T>
        <T x={1470} y={450} size={56} color={p.acc} ls={5} op={fade(c.f, ei + 6)}>PARTS</T>
        {[0, 1, 2].map((i) => <Stamp key={i} t="ALMOST READY" col="#B5653F" x={1470 + (i - 1) * 30} y={620 + i * 105} w={470} s={pop(c.f, al + i * 9, 9)} rot={[-5, 4, -3][i]} />)}
      </>
    );
  },
  t8: (c) => {
    const p = PALS.twain, li = c.c("linotype") - 6, al = c.c("already") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <div style={{ position: "absolute", left: 958, top: 120, width: 6, height: 840, background: "rgba(59,42,34,0.2)" }} />
        <Ico n="machine" x={480} y={560} w={480} c="#a39a90" c2="#8a8f9a" op={0.75} rot={-2} />
        <T x={480} y={860} size={44} color={p.ink} ls={2} op={0.8}>PAIGE: STILL NOT READY</T>
        <Ico n="lino" x={1340} y={560} w={430} c={p.acc2} c2="#e9c46a" s={pop(c.f, li, 14)} />
        {[0, 1, 2, 3].map((i) => { const u = ((c.f - al) / 40 + i / 4) % 1; return c.f >= al ? <Ico key={i} n="news" x={1480 + u * 420} y={520 - 140 * Math.sin(Math.PI * u)} w={110} c="#FBF6E9" op={1 - u * u} rot={u * 30} /> : null; })}
        <T x={1340} y={860} size={44} color={p.acc2} ls={2} op={fade(c.f, li + 8)}>LINOTYPE: ALREADY WORKING</T>
        <T x={1340} y={230} size={76} color={p.ink} s={pop(c.f, li, 12)}>THE RIVAL</T>
      </>
    );
  },
  t9: (c) => {
    const p = PALS.twain, th = c.c("three") - 4, te = c.c("ten") - 4, fa = c.c("failure") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={330} y={FLOOR} w={260} /><Char {...TW} x={330} y={FLOOR} h={600} f={c.f} expr={c.f < fa ? "nervous" : "sad"} prop="pockets" />
        <T x={1010} y={280} size={210} color={p.ink} ls={-4} op={fade(c.f, th)}>{"$" + fmt(count(c.f, th, th + 34, 0, 300000))}</T>
        <T x={1010} y={430} size={44} color={p.ink} ls={3} op={0.75 * fade(c.f, th + 10)}>PUT INTO THE MACHINE, 1880–1894</T>
        <T x={1010} y={560} size={90} color={p.acc} s={pop(c.f, te, 12)}>≈ $10 MILLION TODAY</T>
        <Ico n="machine" x={1500} y={780} w={300} c={MACH.c} c2={MACH.c2} />
        <Stamp t="FAILED" x={1500} y={780} w={420} s={pop(c.f, fa, 9)} rot={-8} />
      </>
    );
  },
  t11: (c) => {
    const p = PALS.twain, to = c.c("tour") - 6, wo = c.c("world") - 4, pd = c.c("paid") - 4, u = clamp((c.f - to) / Math.max(60, c.nv - to)), an = -Math.PI * 0.8 + u * Math.PI * 2;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={330} y={FLOOR} w={260} /><Char {...TW} x={330} y={FLOOR} h={600} f={c.f} expr={c.f < pd ? "neutral" : "smile"} look={1} />
        <T x={330} y={250} size={64} color={p.ink} s={pop(c.f, c.c("sixty") - 4, 10)}>ALMOST 60</T>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: fade(c.f, to - 6) }}>
          <circle cx={1220} cy={540} r={300} fill="#9CC9D6" stroke={INK} strokeWidth={9} />
          <path d="M1060 400 q60 -60 130 -20 q30 50 -20 90 q-70 50 -110 -10 z M1260 380 q90 -40 150 30 q20 70 -50 80 q-80 0 -100 -110 z M1180 600 q60 -20 90 40 q10 80 -50 110 q-60 -20 -40 -150 z M1380 620 q50 -10 70 40 q-20 50 -70 30 z" fill="#B9CF8E" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <ellipse cx={1220} cy={540} rx={420} ry={150} fill="none" stroke={p.acc} strokeWidth={8} strokeDasharray="6 24" strokeLinecap="round" transform="rotate(-14 1220 540)" />
        </svg>
        <Ico n="ship" x={1220 + Math.cos(an) * 420 * Math.cos(-0.244) - Math.sin(an) * 150 * Math.sin(-0.244)} y={540 + Math.cos(an) * 420 * Math.sin(-0.244) + Math.sin(an) * 150 * Math.cos(-0.244)} w={130} c="#8a5a34" c2="#fbf8f2" op={fade(c.f, to)} />
        <T x={1220} y={150} size={60} color={p.acc} ls={2} s={pop(c.f, wo, 12)}>LECTURE TOUR AROUND THE WORLD</T>
        <Stamp t="PAID IN FULL" col="#2E8B4A" x={1220} y={560} w={700} s={pop(c.f, pd, 9)} rot={-8} />
      </>
    );
  },
  t11b: (c) => {
    const p = PALS.twain, ha = c.c("hartford") - 6, mu = c.c("museum") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Box x={1050} y={800} w={640} h={160} bg="#d9d2c0" r={10} />
        <Ico n="machine" x={1050} y={520} w={520} c={MACH.c} c2={MACH.c2} s={pop(c.f, 2, 14)} />
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {[640, 1460].map((x) => <g key={x}><rect x={x - 10} y={720} width={20} height={170} fill={GOLD} stroke={INK} strokeWidth={6} /><circle cx={x} cy={712} r={18} fill={GOLD} stroke={INK} strokeWidth={6} /></g>)}
          <path d="M640 740 Q 1050 860 1460 740" fill="none" stroke="#a8323a" strokeWidth={14} strokeLinecap="round" />
        </svg>
        <Fx k="house" cw={240} ch={240} draw={fxHouse} x={300} y={640} w={330} s={pop(c.f, ha, 12)} />
        <T x={300} y={860} size={40} color={p.ink} ls={2} op={fade(c.f, ha + 6)}>{"HIS OLD HOUSE,\nHARTFORD"}</T>
        <Box x={1050} y={230} w={560} h={110} bg="#3B2A22" s={pop(c.f, mu, 12)}><T x={274} y={50} size={54} color={GOLD} ls={4}>MUSEUM PIECE</T></Box>
        <T x={1640} y={520} size={42} color={p.acc} ls={2} op={fade(c.f, c.c("surviving"))}>{"THE ONLY\nONE LEFT"}</T>
      </>
    );
  },
  t12: (c) => {
    const p = PALS.twain, lo = c.c("love") - 6, fe = c.c("feeding") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} y={150} size={80}>He fell in love with <Em c={p.acc}>one idea</Em></Head>
        <Shadow x={520} y={FLOOR} w={260} /><Char {...TW} x={520} y={FLOOR} h={600} f={c.f} expr={c.f < lo ? "neutral" : "smile_closed"} look={1} />
        <Ico n="machine" x={1320} y={620} w={520} c={MACH.c} c2={MACH.c2} />
        <Ico n="heart" x={900} y={470} w={190} c={RED} s={pop(c.f, lo, 10) * (1 + 0.07 * Math.sin(c.f * 0.4))} />
        <Fly f={c.f} starts={[fe, fe + 12, fe + 24, fe + 36]} ax={640} ay={600} bx={1240} by={580} />
      </>
    );
  },
  t13: Mistake(PALS.twain, 2, "ALL YOUR EGGS\nIN ONE BASKET", (c, s) => <Fx k="basket" cw={320} ch={260} draw={fxBasket} x={1540} y={560} w={420} s={s} />),

  // ================= 3 · FISHER =================
  f0: Title(PALS.fisher, "3", "THE ECONOMIST", "Irving Fisher · New York, 1929", (c) => <Char {...FI} x={1690} y={1010} h={820} f={c.f} expr="smile_closed" s={pop(c.f, 8, 14)} />),
  f1: (c) => {
    const p = PALS.fisher, ex = c.c("experts") - 6, th = c.c("this") - 4;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <div style={{ position: "absolute", left: 1040, top: 0, width: 760, height: 1080, background: "radial-gradient(60% 55% at 50% 55%, rgba(255,255,255,0.95), rgba(255,255,255,0))", opacity: fade(c.f, th, 10) }} />
        <Shadow x={360} y={FLOOR} w={230} /><Char {...NW} x={360} y={FLOOR} h={520} f={c.f} expr={c.f < ex ? "neutral" : "nervous"} />
        <Shadow x={700} y={FLOOR} w={230} /><Char {...TW} x={700} y={FLOOR} h={520} f={c.f} expr={c.f < ex ? "neutral" : "nervous"} />
        <T x={360} y={950} size={36} color={p.ink} ls={2}>PHYSICIST</T><T x={700} y={950} size={36} color={p.ink} ls={2}>WRITER</T>
        <T x={530} y={250} size={58} color={p.acc} s={pop(c.f, ex, 12)}>NOT MONEY EXPERTS</T>
        <Shadow x={1420} y={FLOOR} w={280} op={0.22 * fade(c.f, th)} /><Char {...FI} x={1420} y={FLOOR} h={680} f={c.f} expr="smile" s={pop(c.f, th, 14)} />
        <T x={1420} y={950} size={46} color={p.acc2} ls={3} op={fade(c.f, th + 8)}>MONEY EXPERT ✓</T>
      </>
    );
  },
  f3: (c) => {
    const p = PALS.fisher, iv = c.c("invented") - 4, so = c.c("sold") - 4, st = c.c("stocks") - 6;
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={170} size={92}>He's also <Em c={p.acc2}>rich</Em></Head>
        <Ico n="cards" x={420} y={540} w={330} c="#FBF6E9" c2="#e9c46a" s={pop(c.f, iv, 12)} />
        <T x={420} y={770} size={42} color={p.ink} ls={2} op={fade(c.f, iv + 6)}>{"INVENTS A FILING\nSYSTEM FOR CARDS"}</T>
        <Arrow x0={640} x1={790} y={540} u={out3((c.f - so + 8) / 12)} col={p.ink} />
        <Fx k="cash" cw={320} ch={240} draw={fxCash} x={960} y={540} w={330} s={pop(c.f, so, 12)} />
        <T x={960} y={770} size={42} color={p.ink} ls={2} op={fade(c.f, so + 6)}>SELLS IT</T>
        <Arrow x0={1180} x1={1330} y={540} u={out3((c.f - st + 8) / 12)} col={p.ink} />
        {[0, 1, 2].map((i) => <Fx key={i} k="paper" cw={220} ch={280} draw={(q) => fxPaper(q, 0)} x={1440 + i * 70} y={540 - i * 16} w={190} s={pop(c.f, st + i * 4, 12)} rot={-10 + i * 10} />)}
        <T x={1510} y={770} size={42} color={p.acc2} ls={2} op={fade(c.f, st + 8)}>BUYS STOCKS</T>
      </>
    );
  },
  f4: (c) => {
    const p = PALS.fisher, tw = c.c("twenties") - 10, te = c.c("ten") - 4, up = lerp(1921.6, 1929.67, ease((c.f - tw) / 70));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={64} x={700}>Dow Jones Industrial Average, 1921–1929</Head>
        <Chart x={200} y={280} w={1050} h={580} pts={DOW20} x0={1921} x1={1930} y0={0} y1={420} upTo={up} color={GREEN} ink={p.ink} soft="rgba(30,36,51,0.12)"
          xl={[[1921, "1921"], [1923, "1923"], [1925, "1925"], [1927, "1927"], [1929, "1929"]]} yl={[[100, "100"], [200, "200"], [300, "300"], [400, "400"]]}>{(sx, sy) =>
          <Flag cx={sx(1929.67)} cy={sy(381)} label="381" sub="SEPT 1929" color={GREEN} s={pop(c.f, tw + 72, 10)} dx={-90} len={30} />}</Chart>
        <T x={1560} y={330} size={40} color={p.ink} ls={3} op={fade(c.f, te - 10)}>FISHER'S FORTUNE</T>
        <T x={1560} y={450} size={112} color={p.acc2} ls={-2} op={fade(c.f, te)}>{"$" + fmt(count(c.f, te, te + 30, 0, 10000000))}</T>
        <T x={1560} y={540} size={34} wt={800} color={p.ink} op={0.7 * fade(c.f, te + 16)}>(as reported)</T>
        <Char {...FI} x={1560} y={1000} h={440} f={c.f} expr={c.f < te ? "smile" : "grin"} still />
      </>
    );
  },
  f5: (c) => {
    const p = PALS.fisher, bo = c.c("borrowed") - 6, le = c.c("leverage") - 6, te = c.c("ten") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Box x={520} y={780} w={300} h={190} bg={GREEN} s={pop(c.f, 4, 12)}><T x={144} y={88} size={44} color="#fff">{"HIS\nMONEY"}</T></Box>
        <T x={760} y={680} size={120} color={p.ink} op={fade(c.f, bo)}>+</T>
        <div style={{ position: "absolute", left: 870, top: 875 - 490 * out3((c.f - bo) / 20), width: 560, height: 490 * out3((c.f - bo) / 20), background: "#c9ccd2", border: `8px dashed ${p.acc}`, borderRadius: 24, boxSizing: "border-box", opacity: fade(c.f, bo, 3) }} />
        <T x={1150} y={640} size={64} color={p.acc} op={fade(c.f, bo + 14)}>{"BORROWED\nMONEY"}</T>
        <T x={960} y={210} size={170} color={p.ink} ls={6} s={pop(c.f, le, 12)}>LEVERAGE</T>
        <div style={{ position: "absolute", left: 560, top: 300, height: 14, width: 800 * out3((c.f - le - 6) / 14), background: p.acc, borderRadius: 7 }} />
        <Badge t="10% DOWN" x={1640} y={520} w={460} s={pop(c.f, te, 12)} bg={p.acc2} fg="#fff" />
        <T x={1640} y={650} size={36} wt={800} color={p.ink} op={0.8 * fade(c.f, te + 8)}>{"was enough to buy\nstocks in the 1920s"}</T>
      </>
    );
  },
  f6: (c) => {
    const p = PALS.fisher, te = c.c("ten") - 4, ni = c.c("ninety") - 4, ri = c.c("rises") - 6, db = c.c("doubled") - 4, fa = c.c("falls") - 6, lo = c.c("lost") - 4, K = 4.6, base = 900;
    const Bar = (x: number, own: number, a: number, label: string, ownCol: string, show: boolean) => { const g = out3((c.f - a) / 16); return !show ? null : (
      <>
        <div style={{ position: "absolute", left: x - 110, top: base - (90 + own) * K * g, width: 220, height: 90 * K * g, background: "#c9ccd2", border: `7px solid ${INK}`, boxSizing: "border-box", borderRadius: "14px 14px 0 0" }} />
        {own > 0 && <div style={{ position: "absolute", left: x - 110, top: base - own * K * g, width: 220, height: own * K * g, background: ownCol, border: `7px solid ${INK}`, boxSizing: "border-box" }} />}
        <T x={x} y={base - (90 * K) / 2 - own * K} size={38} color={INK} op={fade(c.f, a + 10)}>{"BORROWED\n$90"}</T>
        <T x={x} y={own > 0 ? base - (own * K) / 2 : base - 30} size={own >= 20 ? 38 : 30} color={own > 0 ? "#fff" : RED} op={fade(c.f, a + 12)}>{"YOURS $" + own}</T>
        <T x={x} y={950} size={40} color={p.ink} ls={1} op={fade(c.f, a + 4)}>{label}</T>
      </>); };
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={120} size={70}>How leverage works</Head>
        <div style={{ position: "absolute", left: 160, right: 160, top: base, height: 7, background: p.ink, opacity: 0.6 }} />
        {Bar(560, 10, ni, "YOU BUY $100 OF STOCK", GREEN, c.f >= ni)}
        <div style={{ position: "absolute", left: 450, top: base - 10 * K * out3((c.f - te) / 12), width: 220, height: 10 * K * out3((c.f - te) / 12), background: GREEN, border: `7px solid ${INK}`, boxSizing: "border-box", opacity: c.f < ni ? 1 : 0 }} />
        <T x={425} y={base - 24} a="r" size={40} color={GREEN} s={c.f < ni ? pop(c.f, te, 10) : 0}>YOURS $10</T>
        {Bar(1080, 20, ri, "STOCK +10%  →  $110", GREEN, c.f >= ri)}
        <T x={1080} y={250} size={110} color={GREEN} s={pop(c.f, db, 12)}>×2</T>
        {Bar(1560, 0, fa, "STOCK −10%  →  $90", RED, c.f >= fa)}
        <T x={1560} y={250} size={110} color={p.acc} s={pop(c.f, lo, 12)}>−100%</T>
      </>
    );
  },
  f7: (c) => {
    const p = PALS.fisher, oc = c.c("october") - 6, pl = c.c("permanently") - 2;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={340} y={FLOOR} w={260} /><Char {...FI} x={340} y={FLOOR} h={620} f={c.f} expr="smile" look={1} wave={c.f > pl ? Math.sin(c.f * 0.25) : undefined} />
        <Box x={1160} y={520} w={1180} h={600} bg="#F7F3E8" s={pop(c.f, oc, 14)} rot={-1.5}>
          <T x={584} y={70} size={40} color={p.acc} ls={5}>OCTOBER 15, 1929</T>
          <div style={{ position: "absolute", left: 60, right: 60, top: 112, height: 6, background: INK }} />
          <T x={584} y={320} size={74} wt={800} color={INK} w={1040} lh={1.18} font='Georgia, "Times New Roman", serif'>“Stock prices have reached what looks like a <span style={{ background: c.f >= pl ? "#ffd84d" : "transparent" }}>permanently high plateau</span>.”</T>
          <T x={584} y={520} size={38} color={p.acc2} ls={3}>IRVING FISHER</T>
        </Box>
      </>
    );
  },
  f8b: (c) => {
    const p = PALS.fisher, tw = c.c("two") - 6, qu = c.c("quarter") - 8;
    const Day = (x: number, d: string, w: string, pct: string, a: number) => (
      <>
        <Box x={x} y={520} w={380} h={460} bg="#fff" s={pop(c.f, a, 12)} rot={x < 700 ? -3 : 3}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 110, background: p.acc }} /><T x={184} y={52} size={52} color="#fff" ls={4}>OCTOBER</T>
          <T x={184} y={230} size={190} color={INK} ls={-4}>{d}</T><T x={184} y={360} size={40} wt={800} color={INK} ls={3}>{w}</T>
        </Box>
        <T x={x} y={840} size={84} color={p.acc} s={pop(c.f, a + 10, 10)}>{"▼ " + pct}</T>
      </>);
    return (
      <>
        <Bg p={p} f={c.f} />
        {Day(500, "28", "MONDAY", "13%", tw)}{Day(960, "29", "TUESDAY", "12%", tw + 8)}
        <T x={1500} y={440} size={54} color={p.ink} ls={2} op={fade(c.f, qu)}>IN TWO DAYS</T>
        <T x={1500} y={590} size={210} color={p.acc} ls={-5} s={pop(c.f, qu, 12)}>−23%</T>
      </>
    );
  },
  f9: (c) => {
    const p = PALS.fisher, re = c.c("recovery") - 6, ho = c.c("holds") - 4;
    const fall: Pt[] = [[0, 90], [1, 78], [2, 82], [3, 60], [4, 66], [5, 44], [6, 48], [7, 30], [8, 34], [9, 16]];
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Chart x={980} y={300} w={800} h={520} pts={fall} x0={0} x1={9} y0={0} y1={100} upTo={lerp(0.5, 9, clamp(c.f / Math.max(60, c.nv)))} color={p.acc} ink={p.ink} soft="rgba(30,36,51,0.12)" yl={[[25, ""], [50, ""], [75, ""]]} />
        <Shadow x={500} y={FLOOR} w={260} /><Char {...FI} x={500} y={FLOOR} h={620} f={c.f} expr="smile" prop={c.f >= ho ? "paper" : null} look={1} />
        {[0, 1, 2].map((i) => <Bubble key={i} x={[420, 620, 480][i]} y={[250, 170, 110][i] + 60} s={pop(c.f, re + i * 26, 10) * (c.f > re + i * 26 + 60 && i < 2 ? 0.0 : 1)} w={430} size={42}>Recovery is near!</Bubble>)}
        <T x={1380} y={210} size={64} color={p.ink} s={pop(c.f, ho, 12)}>HE HOLDS ON</T>
      </>
    );
  },
  f10: (c) => {
    const p = PALS.fisher, a = c.c("summer") - 20, e8 = c.c("eightynine") - 6, up = lerp(1929.67, 1932.52, ease((c.f - a) / 70));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={64} x={700}>Dow Jones Industrial Average, 1929–1932</Head>
        <Chart x={200} y={280} w={1050} h={580} pts={DOW30} x0={1929.4} x1={1933} y0={0} y1={420} upTo={up} color={p.acc} ink={p.ink} soft="rgba(30,36,51,0.12)"
          xl={[[1930, "1930"], [1931, "1931"], [1932, "1932"], [1933, "1933"]]} yl={[[100, "100"], [200, "200"], [300, "300"], [400, "400"]]}>{(sx, sy) => <>
          <Flag cx={sx(1929.67)} cy={sy(381)} label="381" sub="SEPT 1929" color={GREEN} s={1} dx={150} len={10} />
          <Flag cx={sx(1932.52)} cy={sy(41)} label="41" sub="JULY 1932" color={p.acc} s={pop(c.f, a + 72, 10)} len={90} />
        </>}</Chart>
        <T x={1580} y={480} size={196} color={p.acc} ls={-6} s={pop(c.f, e8, 12)}>−89%</T>
        <T x={1580} y={620} size={44} color={p.ink} ls={3} op={fade(c.f, e8 + 10)}>FROM THE PEAK</T>
      </>
    );
  },
  f11: (c) => {
    const p = PALS.fisher, go = c.c("gone"), de = c.c("debt") - 4, si = c.c("sisterinlaw") - 8, ya = c.c("yale") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <T x={620} y={200} size={130} color={c.f > go ? p.acc : p.ink} ls={-3}>{"$" + fmt(count(c.f, 0, go + 6, 10000000, 0))}</T>
        <Stamp t="IN DEBT" x={900} y={340} w={440} s={pop(c.f, de, 9)} rot={-5} />
        <Shadow x={420} y={FLOOR} w={250} /><Char {...FI} x={420} y={FLOOR} h={560} f={c.f} expr="sad" prop={c.f < si + 20 ? "pockets" : "bag"} headTilt={-3} />
        <Shadow x={800} y={FLOOR} w={230} op={0.2 * fade(c.f, si)} /><Char o={townsfolk(1)} ok="tf1" id={41} x={800} y={FLOOR} h={520} f={c.f} expr="stern" s={pop(c.f, si, 12)} flip />
        <T x={800} y={950} size={34} color={p.ink} ls={2} op={fade(c.f, si + 6)}>SISTER-IN-LAW</T>
        <Fx k="house" cw={240} ch={240} draw={fxHouse} x={1450} y={600} w={460} s={pop(c.f, ya, 12)} />
        <Box x={1450} y={300} w={520} h={130} bg={p.acc2} s={pop(c.f, ya + 8, 12)} rot={-2}><T x={254} y={42} size={44} color="#fff" ls={2}>OWNED BY YALE</T><T x={254} y={94} size={32} wt={800} color="#fff">rented back to Fisher</T></Box>
      </>
    );
  },
  f11b: (c) => {
    const p = PALS.fisher, de = c.c("debt") - 6, to = c.c("today") - 6, li = c.c("live") - 8;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Char {...FI} x={480} y={FLOOR - 10} h={600} f={c.f} expr="neutral" look={1} still />
        <Ico n="desk" x={480} y={760} w={560} c="#8a5a34" c2="#e9c46a" />
        <T x={480} y={210} size={50} color={p.ink} ls={2} op={fade(c.f, 6)}>{"WHY DID THE DEPRESSION\nGET SO DEEP?"}</T>
        <Box x={1240} y={520} w={440} h={580} bg="#7a2630" r={16} s={pop(c.f, de, 14)} rot={3}>
          <div style={{ position: "absolute", inset: 22, border: `5px solid ${GOLD}`, borderRadius: 8 }} />
          <T x={214} y={210} size={74} color={GOLD} ls={2}>DEBT</T><T x={214} y={300} size={58} color={GOLD} ls={1}>DEFLATION</T><T x={214} y={450} size={34} wt={800} color="#fff" ls={3}>IRVING FISHER</T>
        </Box>
        <Badge t="STILL USED TODAY" x={1560} y={190} w={600} s={pop(c.f, to, 12)} bg="#0B1E3A" fg={TEAL} />
        <T x={1420} y={920} size={44} wt={800} color={p.acc} op={fade(c.f, li)}>He just had to live through it first.</T>
      </>
    );
  },
  f12: (c) => {
    const p = PALS.fisher, te = c.c("terrible") - 6, bo = c.c("borrowed") - 6, su = c.c("sure") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={380} y={FLOOR} w={270} /><Char {...FI} x={380} y={FLOOR} h={640} f={c.f} expr="sad" prop="pockets" />
        <T x={1180} y={180} size={80} color={p.ink} op={fade(c.f, 4)}>Wiped out. <Em c={p.acc}>Why?</Em></T>
        <Box x={1180} y={400} w={900} h={130} bg="#fff" s={pop(c.f, te, 12)}><T x={444} y={60} size={54} color={INK}>BAD COMPANIES?   <Em c={p.acc}>NO ✗</Em></T></Box>
        <Box x={1180} y={590} w={900} h={130} bg={p.acc} s={pop(c.f, bo, 12)}><T x={444} y={60} size={58} color="#fff">BORROWED MONEY</T></Box>
        <Box x={1180} y={780} w={900} h={130} bg={INK} s={pop(c.f, su, 12)}><T x={444} y={60} size={54} color={GOLD}>+ “I CAN'T BE WRONG”</T></Box>
      </>
    );
  },
  f13: Mistake(PALS.fisher, 3, "LEVERAGE", (c, s) => <Ico n="lever" x={1500} y={560} w={420} c="#c9ccd2" c2={GOLD} s={s} />),
};
