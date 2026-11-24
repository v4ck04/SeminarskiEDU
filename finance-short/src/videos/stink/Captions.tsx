// Word-group captions burned into the picture (1-3 words, key words in gold), timed to stink-short/voice/words.json.
// Same look as the other episodes: Inter Display Black, white with a dark plum outline, a quick pop on each group.
// Spoken numbers are shown as figures ("three and a half million" -> 3.5 MILLION, "twenty sixteen" -> 2016).
import React from "react";
import { AbsoluteFill } from "remotion";
import WORDS from "./words.json";

type W = { w: string; s: number; e: number; line: string };
const GOLD = new Set(["1858", "1875", "stink", "parliament", "escape", "thames", "open", "sewer", "waste", "animals", "garbage", "summer", "thirty", "celsius",
  "baking", "heat", "unbearable", "windows", "curtains", "chemicals", "didn't", "work", "moving", "enough", "18", "days", "bazalgette", "green", "light",
  "underground", "network", "great", "embarrass", "rebuild", "underneath"]);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9.,$']/g, "").replace(/[.,]$/, "");
/** spoken number phrases -> one display token spanning their times */
const MERGE: [string[], string][] = [
  [["eighteen", "fifty", "eight"], "1858"], [["eighteen", "seventy", "five"], "1875"], [["eighteen", "days"], "18 DAYS"], [["thirty", "degrees", "celsius"], "30°C"],
];
const merged: W[] = (() => {
  const src = WORDS as W[], out: W[] = [];
  const bare = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (let i = 0; i < src.length; ) {
    const m = MERGE.find(([seq]) => seq.every((s, k) => src[i + k] && bare(src[i + k].w) === s && src[i + k].line === src[i].line));
    if (m) {
      const last = src[i + m[0].length - 1], punct = (last.w.match(/[.,?!]$/) ?? [""])[0];
      out.push({ w: m[1] + punct, s: src[i].s, e: last.e, line: src[i].line });
      i += m[0].length;
    } else { out.push(src[i]); i++; }
  }
  return out;
})();
const groups: { s: number; e: number; words: W[] }[] = (() => {
  const out: { s: number; e: number; words: W[] }[] = [];
  let g: W[] = [];
  const flush = () => { if (g.length) out.push({ s: g[0].s, e: g[g.length - 1].e, words: g }); g = []; };
  for (const w of merged) {
    if (g.length && (w.line !== g[g.length - 1].line || w.s - g[g.length - 1].e > 0.25)) flush();
    g.push(w);
    const txt = g.map((x) => x.w).join(" ");
    if (g.length === 3 || /[.,?!]$/.test(w.w) || txt.length > 15) flush();
  }
  flush();
  for (let i = 0; i + 1 < out.length; i++) if (out[i + 1].s - out[i].e < 0.5) out[i].e = out[i + 1].s;
  return out;
})();
const goldOf = (w: string) => w.split(" ").some((x) => GOLD.has(norm(x)));

export const Captions: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30, g = groups.find((x) => t >= x.s && t < x.e);
  if (!g) return null;
  const k = Math.min(1, (t - g.s) / 0.09), sc = 0.88 + 0.12 * k;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 560 }}>
      <div style={{ fontFamily: "'Inter Display', Inter, sans-serif", fontWeight: 900, fontSize: 92, lineHeight: 1.05, textAlign: "center", maxWidth: 940,
        color: "#ffffff", WebkitTextStroke: "16px #141016", paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(0,0,0,0.45)", transform: `scale(${sc})`, letterSpacing: "0.01em" }}>
        {g.words.map((w, i) => (
          <span key={i} style={{ color: goldOf(w.w) ? "#ffc93c" : "#ffffff" }}>{w.w.toUpperCase()}{i < g.words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
