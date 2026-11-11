// One scene per 2D beat. Each scene is a function of the beat context (frame in the beat, word cues).
import React from "react";
import {
  Ctx, PALS, Pal, Bg, Char, Fx, T, Box, Ico, Chart, Flag, Shadow, Pt, pop, fade, slide, ease, out3, clamp, lerp, count, fmt, hh,
  INK, NAVY, TEAL, GOLD, RED, GREEN, CREAM, W, H,
} from "./kit";
import {
  NEWTON, AISLABIE, investor, townsfolk, townie, READ, TWAIN_O, FISHER_O, MERI_O, PARTNER, BANKER, REPORTER, FOUNDER,
  fxCoin, fxBag, fxPaper, fxStack, fxBook, fxStamp, fxBadge, fxQuestion, fxBasket, fxSoap, fxPill, fxBulb, fxBreakfast, fxCash, fxHouse, fxGlobe, fxWarning,
  fxApple, fxIntegral, fxBill, fxPuff, fxBurst,
} from "../toon";

export type Scene = (c: Ctx) => React.ReactNode;
const CH: Record<string, string> = { newton: "1 · THE PHYSICIST · 1720", twain: "2 · THE WRITER · 1880–1894", fisher: "3 · THE ECONOMIST · 1929", ltcm: "4 · THE NOBEL WINNERS · 1998", pattern: "THE PATTERN", read: "THE JANITOR" };
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
    <T x={num ? 470 : 170} y={470 + 40 * (1 - slide(c.f, 4))} a="l" size={130} color={pal.ink} op={fade(c.f, 4, 8)} ls={-2}>{title}</T>
    <div style={{ position: "absolute", left: num ? 476 : 176, top: 566, height: 10, width: 560 * out3((c.f - 10) / 16), background: pal.acc2, borderRadius: 5 }} />
    <T x={num ? 474 : 174} y={640} a="l" size={58} wt={800} color={pal.ink} op={0.85 * fade(c.f, 14, 8)} ls={0}>{sub}</T>
    {who(c)}
  </>
);
/** "Mistake number N" card */
export const Mistake = (pal: Pal, num: number, name: string, icon: (c: Ctx, s: number) => React.ReactNode): Scene => (c) => {
  const a = Math.max(8, c.c("number") - 2), b = Math.max(a + 14, c.nv - 34), s = pop(c.f, b, 12);
  return (
    <>
      <Bg p={PALS.pattern} f={c.f} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: pal.bg }} />
      <T x={960} y={250 + 30 * (1 - slide(c.f, a))} size={74} color={TEAL} ls={8} op={fade(c.f, a, 8)}>{`MISTAKE #${num}`}</T>
      <T x={840} y={560} a="c" size={name.length > 16 ? 124 : 168} color="#fff" s={s} w={1100} lh={1.0} ls={-2}>{name}</T>
      {icon(c, pop(c.f, b + 6, 12))}
      <div style={{ position: "absolute", left: 360, top: 860, height: 12, width: 1200 * out3((c.f - b - 4) / 18), background: GOLD, borderRadius: 6 }} />
      {[1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 786 + i * 58, top: 930, width: 40, height: 40, borderRadius: 20, background: i <= num ? RED : "rgba(255,255,255,0.16)", transform: `scale(${i === num ? pop(c.f, b + 10, 10) : 1})` }} />)}
    </>
  );
};
// South Sea share price, 1720 (verified points; April held near 350)
const SS: Pt[] = [[1, 128], [3, 330], [4.7, 350], [5.9, 550], [6.2, 890], [8.1, 1000], [9.9, 150], [12, 100]];
const SSX: [number, string][] = [[1, "JAN"], [3, "MAR"], [5, "MAY"], [7, "JUL"], [9, "SEP"], [12, "DEC"]];
const SSY: [number, string][] = [[250, "£250"], [500, "£500"], [750, "£750"], [1000, "£1,000"]];
const SSChart: React.FC<{ upTo: number; x?: number; y?: number; w?: number; h?: number; children?: (sx: (v: number) => number, sy: (v: number) => number) => React.ReactNode }> = ({ upTo, x = 330, y = 300, w = 1400, h = 560, children }) =>
  <Chart x={x} y={y} w={w} h={h} pts={SS} x0={1} x1={12} y0={0} y1={1100} upTo={upTo} color={PALS.newton.acc2} color2={PALS.newton.acc} split={8.1} ink={PALS.newton.ink} soft="rgba(58,42,28,0.14)" xl={SSX} yl={SSY}>{children}</Chart>;
const ssY = (x: number) => { for (let i = 1; i < SS.length; i++) if (x <= SS[i][0]) return SS[i - 1][1] + ((SS[i][1] - SS[i - 1][1]) * (x - SS[i - 1][0])) / (SS[i][0] - SS[i - 1][0]); return 100; };
export const NW = { o: NEWTON, ok: "newton", id: 7 }, TW = { o: TWAIN_O, ok: "twain", id: 8 }, FI = { o: FISHER_O, ok: "fisher", id: 9 }, MW = { o: MERI_O, ok: "meri", id: 10 }, RR = { o: READ, ok: "read", id: 11 };
export const P1 = { o: PARTNER(0), ok: "partner0", id: 60 }, P2 = { o: PARTNER(1), ok: "partner1", id: 61 }, P3 = { o: PARTNER(2), ok: "partner2", id: 62 }, P4 = { o: PARTNER(3), ok: "partner3", id: 63 };
export const inv = (v: number) => ({ o: investor(v), ok: "inv" + v, id: 100 + v });
/** a speech bubble with text, tail at the bottom */
export const Bubble: React.FC<{ x: number; y: number; s: number; w?: number; size?: number; bg?: string; color?: string; children: React.ReactNode }> = ({ x, y, s, w = 300, size = 44, bg = "#fff", color = INK, children }) => (s <= 0 ? null : (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 60, width: w, transform: `scale(${s})`, transformOrigin: "50% 130%" }}>
    <div style={{ background: bg, border: `6px solid ${INK}`, borderRadius: 30, padding: "16px 10px", textAlign: "center", fontFamily: '"Inter Display", Inter, sans-serif', fontWeight: 900, fontSize: size, lineHeight: 1.05, color }}>{children}</div>
    <div style={{ position: "absolute", left: w / 2 - 16, bottom: -20, width: 32, height: 32, background: bg, borderRight: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`, transform: "rotate(45deg)" }} />
  </div>
));

export const SCENES: Record<string, Scene> = {
  // ================= HOOK =================
  h2: (c) => {
    const p = PALS.hook, xs = [330, 750, 1170, 1590];
    const who: [typeof NW, string, number][] = [[NW, "THE PHYSICIST", 0], [TW, "THE WRITER", c.c("writer") - 4], [FI, "THE ECONOMIST", c.c("economist") - 4]];
    const nb = c.c("nobel") - 4, four = c.c("four"), same = c.c("same");
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} a={0} y={150} size={92}>{c.f < four - 2 ? <>He wasn't <Em c={GOLD}>alone</Em></> : c.f < same - 2 ? <><Em c={GOLD}>4</Em> geniuses</> : <>The same <Em c={RED}>4 mistakes</Em></>}</Head>
        {who.map(([w, label, a], i) => (
          <React.Fragment key={i}>
            <Box x={xs[i]} y={590} w={360} h={520} bg="rgba(255,255,255,0.07)" bd="rgba(255,255,255,0.22)" bw={5} s={pop(c.f, a, 12)} shadow={false} />
            <Char {...w} x={xs[i]} y={842} h={600} f={c.f} expr={c.f >= same ? "shock" : "smile"} s={pop(c.f, a + 2, 12)} />
            <T x={xs[i]} y={910} size={34} color={TEAL} ls={3} op={fade(c.f, a + 8)}>{label}</T>
          </React.Fragment>
        ))}
        <Box x={xs[3]} y={590} w={360} h={520} bg="rgba(255,255,255,0.07)" bd="rgba(255,255,255,0.22)" bw={5} s={pop(c.f, nb, 12)} shadow={false} />
        <Char {...P1} x={xs[3] - 82} y={838} h={500} f={c.f} expr={c.f >= same ? "shock" : "smile"} s={pop(c.f, nb + 2, 12)} />
        <Char {...P3} x={xs[3] + 82} y={838} h={500} f={c.f} expr={c.f >= same ? "pained" : "smile_closed"} s={pop(c.f, nb + 5, 12)} />
        <T x={xs[3]} y={910} size={34} color={TEAL} ls={3} op={fade(c.f, nb + 8)}>THE NOBEL WINNERS</T>
        {xs.map((x, i) => <Ico key={i} n="cross" x={x + 120} y={380} w={130} c={RED} s={pop(c.f, same + i * 4, 10)} rot={-8} />)}
      </>
    );
  },
  h3: (c) => {
    const p = PALS.hook, e = c.c("eight") - 3, av = c.c("avoided");
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={520} y={FLOOR} w={300} op={0.4} />
        <Char {...RR} x={520} y={FLOOR} h={640} f={c.f} prop="mop" expr="smile_closed" sil="#000" s={pop(c.f, 2, 12)} />
        <Fx k="q" cw={300} ch={300} draw={fxQuestion} x={520} y={150} w={150} s={pop(c.f, 12, 10)} />
        <T x={1230} y={250} size={64} color={TEAL} ls={6} op={fade(c.f, c.c("janitor") - 4)}>AND ONE JANITOR</T>
        {[0, 1, 2, 3].map((i) => <Ico key={i} n="check" x={990 + i * 160} y={420} w={120} c={GREEN} s={pop(c.f, av + i * 4, 10)} />)}
        <T x={1230} y={640} size={190} color={GOLD} op={fade(c.f, e, 5)} s={0.8 + 0.2 * pop(c.f, e, 12)} ls={-3}>{"$" + fmt(count(c.f, e, e + 34, 0, 8000000))}</T>
        <T x={1230} y={790} size={46} wt={800} color="#fff" op={0.8 * fade(c.f, e + 20)} ls={1}>and nobody knew</T>
      </>
    );
  },
  h4: (c) => {
    const p = PALS.hook, st = c.c("let's") - 2;
    return (
      <>
        <Bg p={p} f={c.f} />
        <T x={960} y={330 + 30 * (1 - slide(c.f, 0))} size={150} color="#fff" op={fade(c.f, 0)} ls={-3}>4 GENIUSES</T>
        <T x={960} y={490 + 30 * (1 - slide(c.f, 5))} size={104} color={GOLD} op={fade(c.f, 5)} ls={-1}>WHO LOST A FORTUNE</T>
        <div style={{ position: "absolute", left: 610, top: 580, height: 10, width: 700 * out3((c.f - 12) / 16), background: TEAL, borderRadius: 5 }} />
        <T x={960} y={670} size={52} wt={800} color="#fff" op={0.85 * fade(c.f, 16)} ls={1}>…and the janitor who didn't</T>
        {["1720", "1894", "1929", "1998"].map((y, i) => <T key={y} x={510 + i * 300} y={850} size={56} color={i === 0 && c.f >= st ? GOLD : "rgba(255,255,255,0.5)"} s={pop(c.f, 24 + i * 5, 10) * (i === 0 && c.f >= st ? 1.25 : 1)}>{y}</T>)}
      </>
    );
  },

  // ================= 1 · NEWTON =================
  n0: Title(PALS.newton, "1", "THE PHYSICIST", "Isaac Newton · London, 1720", (c) => <Char {...NW} x={1580} y={1010} h={820} f={c.f} expr="smile" s={pop(c.f, 8, 14)} />),
  n2: (c) => {
    const p = PALS.newton, ss = c.c("south") - 4, xs = [260, 610, 960, 1310, 1660];
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} a={ss} y={160} size={104}>THE <Em c={p.acc}>SOUTH SEA</Em> COMPANY</Head>
        {xs.map((x, i) => (
          <React.Fragment key={i}>
            <Shadow x={x} y={FLOOR} w={220} />
            <Char {...inv([0, 5, 2, 9, 4][i])} x={x} y={FLOOR} h={470} f={c.f} expr={i % 2 ? "grin" : "smile"} wave={i % 2 ? Math.sin(c.f * 0.3 + i) : undefined} s={pop(c.f, 2 + i * 3, 12)} />
            <Bubble x={x} y={350 - (i % 2) * 46} s={pop(c.f, 14 + i * 7, 10)} w={i % 2 ? 250 : 300} size={i % 2 ? 60 : 38}>{i % 2 ? "£ £ £" : i === 2 ? "Buy more!" : "South Sea!"}</Bubble>
          </React.Fragment>
        ))}
      </>
    );
  },
  n2b: (c) => {
    const p = PALS.newton, al = c.c("exchange") - 4, lo = c.c("lords") - 4, se = c.c("servants") - 4;
    const row: [ReturnType<typeof inv>, number, number, string][] = [[{ o: AISLABIE, ok: "aislabie", id: 31 }, 1010, lo, "LORDS"], [inv(1), 1250, lo + 6, ""], [inv(3), 1470, se - 6, ""], [{ o: townie(3), ok: "townie3", id: 34 }, 1700, se, "SERVANTS"]];
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Ico n="cup" x={330} y={520} w={380} c="#fbf8f2" s={pop(c.f, 2, 12)} />
        <T x={330} y={760} size={44} color={p.ink} ls={3} op={fade(c.f, 10)}>COFFEE HOUSES</T>
        <Box x={1100} y={210} w={880} h={150} bg="#3A2A1C" bd={INK} s={pop(c.f, al, 12)} rot={-2}><T x={434} y={68} size={84} color="#F3E7C9" ls={3}>EXCHANGE ALLEY</T></Box>
        {row.map(([w, x, a, label], i) => (
          <React.Fragment key={i}>
            <Shadow x={x} y={FLOOR} w={200} op={0.2 * fade(c.f, a)} />
            <Char {...w} x={x} y={FLOOR} h={520} f={c.f} expr={i % 2 ? "grin" : "smile"} prop={c.f > a + 16 ? "paper" : null} s={pop(c.f, a, 12)} />
            {label && <T x={x} y={950} size={40} color={p.acc} ls={3} op={fade(c.f, a + 6)}>{label}</T>}
          </React.Fragment>
        ))}
        <T x={1355} y={400} size={70} color={p.ink} op={fade(c.f, se + 14)} s={pop(c.f, se + 14, 10)}>EVERYBODY WANTS IN</T>
      </>
    );
  },
  n3: (c) => {
    const p = PALS.newton, no = c.c("nothing") - 4, de = c.c("debt") - 6, fl = c.c("flying") - 6, u = ease((c.f - 6) / Math.max(40, no - 6));
    const sx = lerp(1250, 620, u), sy = lerp(330, 610, u) + 8 * Math.sin(c.f * 0.2);
    return (
      <>
        <Bg p={p} f={c.f} />
        <div style={{ position: "absolute", left: 120, top: 150, width: 1680, height: 780, borderRadius: 40, background: "#9CC9D6", border: `8px solid ${INK}`, overflow: "hidden", opacity: fade(c.f, 0) }}>
          <svg width={1680} height={780} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M1260 60 q70 -40 110 10 q40 60 -10 120 q-50 40 -90 0 q-50 -60 -10 -130 z" fill="#B9CF8E" stroke={INK} strokeWidth={8} />
            <path d="M230 360 q130 -70 230 30 q80 110 20 250 q-60 150 -150 110 q-110 -70 -130 -220 q-20 -110 30 -170 z" fill="#B9CF8E" stroke={INK} strokeWidth={8} />
            <path d="M1130 190 Q 900 300 520 470" fill="none" stroke={INK} strokeWidth={7} strokeDasharray="4 22" strokeLinecap="round" />
          </svg>
          <T x={1320} y={250} size={38} color={INK} ls={2}>BRITAIN</T>
          <T x={360} y={300} size={38} color={INK} ls={2}>SOUTH AMERICA</T>
        </div>
        <Ico n="ship" x={sx} y={sy} w={190} c="#8a5a34" c2="#fbf8f2" rot={3 * Math.sin(c.f * 0.2)} s={fade(c.f, 2)} />
        <Ico n="chest" x={900} y={690} w={230} c="#8a5a34" c2="#a0703f" s={pop(c.f, no, 12)} />
        <T x={900} y={835} size={50} color={p.acc} s={pop(c.f, no + 5, 10)}>TRADE PROFIT ≈ £0</T>
        <Box x={1420} y={610} w={470} h={150} bg="#FBF6E9" s={pop(c.f, de, 12)} rot={2}><T x={229} y={48} size={44} color={INK}>NATIONAL DEBT</T><T x={229} y={102} size={32} wt={800} color={p.acc}>taken over by the company</T></Box>
        <T x={1380} y={850 - 50 * ease((c.f - fl) / 30)} size={96} color={p.acc2} s={pop(c.f, fl, 12)} stroke={INK} sw={0}>SHARE PRICE ▲</T>
      </>
    );
  },
  n4: (c) => {
    const p = PALS.newton, j = c.c("january"), m = c.c("march"), up = c.f < j ? 1 : lerp(1, 3, ease((c.f - j) / Math.max(30, m - j + 12)));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={170} size={72}>South Sea Company · price of one share, 1720</Head>
        <SSChart upTo={up}>{(sx, sy) => <>
          <Flag cx={sx(1)} cy={sy(128)} label="£128" sub="JANUARY" color={p.acc2} s={pop(c.f, j, 10)} dx={60} />
          <Flag cx={sx(3)} cy={sy(330)} label="£330" sub="MARCH" color={p.acc2} s={pop(c.f, m + 8, 10)} />
        </>}</SSChart>
      </>
    );
  },
  n5: (c) => {
    const p = PALS.newton, a = c.c("april") - 2, tw = c.c("twenty") - 4, sm = c.c("smart") - 4, up = lerp(3, 4.7, ease((c.f - 2) / Math.max(20, a + 10)));
    return (
      <>
        <Bg p={p} f={c.f} />
        <SSChart upTo={up}>{(sx, sy) => <>
          <Flag cx={sx(3)} cy={sy(330)} label="£330" sub="MARCH" color={p.acc2} s={1} />
          <Flag cx={sx(4.7)} cy={sy(350)} label="NEWTON SELLS" sub="APRIL" color={GOLD.replace("FFC94A", "D99A1C")} s={pop(c.f, a + 8, 12)} len={150} dx={40} />
        </>}</SSChart>
        <Shadow x={1560} y={900} w={230} />
        <Char {...NW} x={1560} y={900} h={500} f={c.f} expr={c.f < tw ? "smile" : "grin"} prop={c.f >= a + 8 ? "bags" : "paper"} />
        <T x={1240} y={230} size={150} color={p.acc2} s={pop(c.f, tw, 12)} ls={-3}>+£20,000</T>
        <Fx k="smart" cw={520} ch={200} draw={(q) => fxStamp(q, "SMART MOVE", "#2E8B4A")} x={1130} y={660} w={520} s={pop(c.f, sm, 10)} />
      </>
    );
  },
  n6: (c) => {
    const p = PALS.newton, m = c.c("may"), j = c.c("june"), up = c.f < m - 20 ? lerp(4.7, 5.0, ease(c.f / 30)) : c.f < j - 12 ? lerp(5.0, 5.9, ease((c.f - (m - 20)) / 26)) : lerp(5.9, 6.2, ease((c.f - (j - 12)) / 22));
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={170} size={84}>…but the price <Em c={p.acc2}>doesn't stop</Em></Head>
        <SSChart upTo={up}>{(sx, sy) => <>
          <Flag cx={sx(4.7)} cy={sy(350)} label="SOLD" sub="APRIL" color="#D99A1C" s={1} up={false} len={60} />
          <Flag cx={sx(5.9)} cy={sy(550)} label="£550" sub="END OF MAY" color={p.acc2} s={pop(c.f, m + 6, 10)} dx={-120} len={60} />
          <Flag cx={sx(6.2)} cy={sy(890)} label="£890" sub="EARLY JUNE" color={p.acc2} s={pop(c.f, j + 10, 10)} dx={-150} len={40} />
        </>}</SSChart>
        <Shadow x={1560} y={900} w={230} />
        <Char {...NW} x={1560} y={900} h={500} f={c.f} expr={c.f < m ? "neutral" : c.f < j ? "nervous" : "shock"} look={-1} />
      </>
    );
  },
  n7: (c) => {
    const p = PALS.newton, fr = c.c("friends") - 4, wk = c.c("week"), k = Math.floor(clamp((c.f - wk + 30) / 150) * 7) + 2;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} y={150} size={86}>The part that <Em c={p.acc}>hurts</Em></Head>
        <Shadow x={400} y={FLOOR} w={250} />
        <Char {...NW} x={400} y={FLOOR} h={560} f={c.f} expr={c.f < wk ? "nervous" : "sad"} prop="pockets" look={1} />
        <T x={400} y={960} size={42} color={p.ink} ls={3}>NEWTON: OUT</T>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <Shadow x={1040 + i * 300} y={FLOOR} w={220} op={0.2 * fade(c.f, fr + i * 4)} />
            <Char {...inv([0, 7, 2][i])} x={1040 + i * 300} y={FLOOR} h={460} f={c.f} expr={i === 1 ? "laugh" : "grin"} wave={Math.sin(c.f * 0.3 + i * 2)} s={pop(c.f, fr + i * 4, 12)} />
            <Fx k={"stack" + Math.min(9, k + i)} cw={300} ch={400} draw={(q) => fxStack(q, Math.min(9, k + i))} x={1180 + i * 300} y={740} w={210} s={pop(c.f, fr + 10 + i * 4, 10)} />
          </React.Fragment>
        ))}
        <T x={1340} y={960} size={42} color={p.acc2} ls={3} op={fade(c.f, fr + 10)}>FRIENDS: STILL IN</T>
        <T x={1340} y={330} size={70} color={p.acc2} op={fade(c.f, wk)} s={pop(c.f, wk, 10)}>richer every week</T>
      </>
    );
  },
  n9: (c) => {
    const p = PALS.newton, au = c.c("august") - 4, se = c.c("september") - 6;
    const up = c.f < se ? lerp(6.2, 8.1, ease((c.f - au + 10) / 44)) : lerp(8.1, 9.9, ease((c.f - se) / 30) ** 1.6);
    const sh = c.f >= se + 20 && c.f < se + 34 ? 9 * Math.sin(c.f * 2.4) * (1 - (c.f - se - 20) / 14) : 0;
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh}px, ${sh * 0.6}px)` }}>
        <Bg p={p} f={c.f} />
        <SSChart upTo={up}>{(sx, sy) => <>
          <Flag cx={sx(4.7)} cy={sy(350)} label="SOLD" sub="APRIL" color="#D99A1C" s={1} up={false} len={60} />
          <Flag cx={sx(6.25)} cy={sy(900)} label="BOUGHT BACK" sub="JUNE" color={p.acc} s={pop(c.f, 4, 10)} dx={-200} len={30} />
          <Flag cx={sx(8.1)} cy={sy(1000)} label="£1,000" sub="AUGUST" color={p.acc2} s={pop(c.f, au + 30, 10)} len={40} />
          <Flag cx={sx(9.9)} cy={sy(150)} label="£150" sub="END OF SEPTEMBER" color={p.acc} s={pop(c.f, se + 30, 10)} dx={150} len={90} />
        </>}</SSChart>
        <T x={1500} y={330} size={130} color={p.acc} s={pop(c.f, se + 36, 12)} rot={-6} ls={-2}>−85%</T>
      </div>
    );
  },
  n9b: (c) => {
    const p = PALS.newton, pa = c.c("parliament") - 4, to = c.c("tower") - 8, mi = c.c("mint") - 6;
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Head c={c} p={p} y={150} size={84} x={620}>Thousands are <Em c={p.acc}>ruined</Em></Head>
        {[0, 1, 2, 3].map((i) => <React.Fragment key={i}><Shadow x={200 + i * 230} y={FLOOR} w={200} /><Char {...inv([0, 5, 3, 6][i])} x={200 + i * 230} y={FLOOR} h={420} f={c.f} expr={i % 2 ? "sad" : "pained"} prop="pockets" s={pop(c.f, i * 3, 12)} /></React.Fragment>)}
        <Ico n="tower" x={1480} y={FLOOR - 320 * slide(c.f, to, 18) + 20} w={640} c="#b8b2a6" c2="#3a3440" op={fade(c.f, to, 4)} />
        <Char o={AISLABIE} ok="aislabie" id={31} x={1480} y={FLOOR - 235} h={200} f={c.f} expr="sad" s={pop(c.f, to + 14, 10)} still />
        <svg width={120} height={150} style={{ position: "absolute", left: 1422, top: FLOOR - 420, opacity: fade(c.f, to + 16) }}>{[20, 50, 80, 110].map((x) => <line key={x} x1={x - 6} x2={x - 6} y1={0} y2={150} stroke={INK} strokeWidth={9} />)}</svg>
        <T x={1480} y={960} size={40} color={p.ink} ls={3} op={fade(c.f, to + 10)}>TOWER OF LONDON</T>
        <Box x={1040} y={360} w={420} h={110} bg="#3A2A1C" s={pop(c.f, pa, 12)} rot={-3}><T x={204} y={50} size={50} color="#F3E7C9" ls={2}>PARLIAMENT</T></Box>
        {[0, 1, 2, 3, 4].map((i) => { const u = (c.f - mi - i * 5) / 30; return u > 0 ? <Fx key={i} k="coin0" cw={200} ch={200} draw={(q) => fxCoin(q, 0)} x={1730 + i * 22 + 40 * Math.min(u, 1)} y={lerp(500, 800 - (i % 2) * 40, Math.min(1, u * u))} w={80} /> : null; })}
        <T x={1790} y={400} size={40} color={p.acc2} ls={2} s={pop(c.f, mi, 10)}>{"NEWTON'S\nMINT"}</T>
      </>
    );
  },
  n10: (c) => {
    const p = PALS.newton, th = c.c("third") - 6, wr = c.c("wrote") - 6, k = lerp(1, 0.667, ease((c.f - th) / 30));
    return (
      <>
        <Bg p={p} f={c.f} floor={FLOOR} />
        <Shadow x={330} y={FLOOR} w={250} />
        <Char {...NW} x={330} y={FLOOR} h={560} f={c.f} expr="sad" prop="pockets" headTilt={-3} />
        <T x={640} y={230} a="l" size={44} color={p.ink} ls={3} op={fade(c.f, 2)}>NEWTON'S FORTUNE</T>
        <T x={640} y={330} a="l" size={38} wt={800} color={p.ink} op={0.8 * fade(c.f, 4)}>BEFORE THE BUBBLE</T>
        <div style={{ position: "absolute", left: 640, top: 362, height: 84, width: 1100 * out3((c.f - 4) / 18), background: p.acc2, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box" }} />
        <T x={1716} y={404} a="r" size={46} color="#fff" op={fade(c.f, 16)}>just over £30,000</T>
        <T x={640} y={500} a="l" size={38} wt={800} color={p.ink} op={0.8 * fade(c.f, th - 16)}>AFTER</T>
        <div style={{ position: "absolute", left: 640, top: 532, height: 84, width: 1100 * k * fade(c.f, th - 16, 1), background: p.acc, border: `6px solid ${INK}`, borderRadius: 14, boxSizing: "border-box" }} />
        <T x={640 + 1100 * k - 20} y={574} a="r" size={46} color="#fff" op={fade(c.f, th + 20)}>about £20,000</T>
        <T x={1560} y={574} size={64} color={p.acc} s={pop(c.f, th + 24, 10)}>−⅓</T>
        <Box x={1190} y={790} w={1100} h={210} bg="#FBF6E9" s={pop(c.f, wr, 12)} rot={-1}>
          <T x={544} y={78} size={46} wt={800} color={INK} w={1020} lh={1.2} font='Georgia, "Times New Roman", serif'>“I lost very much by the South Sea company, which makes my pockets empty.”</T>
          <T x={544} y={164} size={30} wt={800} color={p.acc} ls={2}>ISAAC NEWTON, IN A LETTER</T>
        </Box>
      </>
    );
  },
  n11: (c) => {
    const p = PALS.newton, ma = c.c("math") - 4, ri = c.c("right") - 6, co = c.c("couldn't") - 4;
    return (
      <>
        <Bg p={p} f={c.f} />
        <Head c={c} p={p} y={150} size={84}>What went <Em c={p.acc}>wrong</Em>?</Head>
        <SSChart upTo={12} x={160} y={300} w={980} h={520}>{(sx, sy) => <>
          <Flag cx={sx(4.7)} cy={sy(350)} label="SOLD ✓" color={p.acc2} s={pop(c.f, ri, 12)} up={false} len={70} />
          <Flag cx={sx(6.25)} cy={sy(900)} label="BOUGHT ✗" color={p.acc} s={pop(c.f, co, 12)} dx={-170} len={20} />
        </>}</SSChart>
        <Box x={1530} y={380} w={560} h={150} bg="#FBF6E9" s={pop(c.f, ma, 12)} rot={2}><T x={274} y={46} size={42} color={INK}>HIS MATH?</T><T x={274} y={100} size={46} color={p.acc2}>FINE ✓</T></Box>
        <Box x={1530} y={610} w={560} h={190} bg="#3A2A1C" s={pop(c.f, co + 10, 12)} rot={-2}><T x={274} y={56} size={40} color="#F3E7C9">WATCHING OTHERS</T><T x={274} y={120} size={54} color={GOLD}>GET RICH</T></Box>
        <Char {...NW} x={1530} y={1010} h={330} f={c.f} expr="nervous" look={-1} still />
      </>
    );
  },
  n12: Mistake(PALS.newton, 1, "FOLLOWING\nTHE CROWD", (c, s) => <Ico n="crowd" x={1520} y={560} w={420} c={RED} c2="#3f6fb5" s={s} />),
};
