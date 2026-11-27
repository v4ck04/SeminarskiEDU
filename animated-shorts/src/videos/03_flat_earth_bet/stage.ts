// 03_flat_earth_bet staging: who / what is where per frame (identity timeline: staging frame = voice frame).
// Places: the street (bank unit x 19.4..25.4 = THE WEEKLY TIMES, Wallace's door = FIVE & DIME unit, x -22.7),
// the Old Bedford fen (FEN z = -260, canal along x, people on the north towpath z = -255.8), the jail (JAIL z = -420).
import {TOTAL, shotAt, W, cl, type V3} from '../../engine/core/clock';
import {autoGaze} from '../../engine/core/staging';
import {PersonP, seq, type ActName} from '../../engine/chars/rig';
import type {Expr} from '../../engine/chars/charparts';
import type {CarP, MeterP, Things} from '../../engine/kits/downtown/street';
import type {CartP} from '../../engine/kits/grocery/store';
export {TOTAL, shotAt};

export type Stage = {people: PersonP[]; carts: CartP[]; extra: string[]; cars: CarP[]; meters: MeterP[]; things: Things; clock: number; nStoryCars: number;
  loc: 'street' | 'fen' | 'jail'; disc: number; discSpin: number; paper: number; placard: number; fraud: number; marks: number[]; line: number; lift: number;
  letters: number; letter: number; year: number; bars: number; jailDisc: number};

const FZ = -255.8, JZ = -420;   // north towpath, jail
const w = (shot: string, word: string) => W(shot, word);
function mv(lf: number, keys: [number, number, number][]): {p: V3; moving: boolean} {
  if (lf <= keys[0][0]) return {p: [keys[0][1], 0, keys[0][2]], moving: false};
  for (let i = 1; i < keys.length; i++) if (lf < keys[i][0]) { const [a, x0, z0] = keys[i - 1], [b, x1, z1] = keys[i], u = (lf - a) / (b - a);
    return {p: [x0 + (x1 - x0) * u, 0, z0 + (z1 - z0) * u], moving: !(x0 === x1 && z0 === z1)}; }
  const k = keys[keys.length - 1]; return {p: [k[1], 0, k[2]], moving: false};
}
function walker(who: PersonP['who'], lf: number, keys: [number, number, number][], still: [number, ActName, Expr?][], o: Partial<PersonP> = {}): PersonP {
  const m = mv(lf, keys);
  return m.moving ? {who, p: m.p, act: 'walk', expr: (o.expr ?? 'neutral') as Expr, ...o} : {who, p: m.p, ...seq(lf, still), ...o};
}

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, P: PersonP[] = [];
  const st: Stage = {people: P, carts: [], extra: [], cars: [], meters: [], things: {}, clock: 10.2, nStoryCars: 0,
    loc: 'street', disc: 0, discSpin: f * 0.02, paper: 0, placard: 0, fraud: 0, marks: [0, 0, 0], line: 0, lift: 0, letters: -1, letter: 0, year: 1870, bars: 1, jailDisc: 0};
  const fenDone = () => { st.loc = 'fen'; st.marks = [1, 1, 1]; st.line = 1; st.lift = 0.9; };
  switch (s.name) {
    // ---------------- street: the bet ----------------
    case 'hook': {
      st.placard = cl(lf / 8);
      P.push({who: 'hampden', p: [22.4, 0, 6.0], ...seq(lf, [[0, 'present', 'smug'], [w('hook', 'flat') - 4, 'proud', 'grin'], [w('hook', 'man') - 4, 'idle', 'smug']]), gaze: 'cam'});
      P.push({who: 'wallace', p: [26.0, 0, 6.6], ...seq(lf, [[0, 'idle', 'neutral'], [w('hook', 'regretted') - 4, 'slump', 'tired']]), gaze: [22.4, 1, 6.0]});
      break;
    }
    case 'idea': {
      st.disc = cl((lf - w('idea', 'flat') + 4) / 10);
      P.push({who: 'hampden', p: [22.4, 0, 6.0], ...seq(lf, [[0, 'think', 'smug'], [w('idea', 'flat') - 2, 'eureka', 'grin']])});
      break;
    }
    case 'offer': {
      st.paper = cl((lf - 2) / 14);
      P.push({who: 'hampden', p: [22.4, 0, 6.0], ...seq(lf, [[0, 'present', 'grin']]), gaze: 'cam'});
      break;
    }
    case 'laugh': {
      const one = w('laugh', 'One');
      P.push({who: 'man', p: [19.0, 0, 6.4], ...seq(lf, [[0, 'flex', 'grin'], [one + 10, 'shrug', 'smug']]), talk: lf < one, gaze: [20.6, 1, 6.9]});
      P.push({who: 'youngman', p: [20.6, 0, 6.9], ...seq(lf, [[0, 'bounce', 'grin'], [one + 10, 'idle', 'smug']]), talk: lf < one, gaze: [19.0, 1, 6.4]});
      P.push({who: 'woman', p: [21.9, 0, 6.3], ...seq(lf, [[0, 'shrug', 'grin']]), gaze: [20.6, 1, 6.9]});
      P.push({who: 'wallace', p: [25.6, 0, 6.6], ...seq(lf, [[0, 'think', 'neutral'], [one, 'think', 'smirk'], [w('laugh', 'greatest') - 6, 'proud', 'proud']]), gaze: lf > w('laugh', 'greatest') - 6 ? 'cam' : [21, 1, 6.6]});
      break;
    }
    // ---------------- the fen ----------------
    case 'canal': {
      st.loc = 'fen';
      P.push(walker('wallace', lf, [[0, 96, FZ], [s.len, 90, FZ]], [[0, 'idle', 'neutral']], {expr: 'happy'}));
      P.push(walker('shopper2', lf, [[0, 98.2, FZ - 0.3], [s.len, 92.2, FZ - 0.3]], [[0, 'idle', 'neutral']]));
      break;
    }
    case 'markers': {
      st.loc = 'fen';
      const t = w('markers', 'three'), m2 = w('markers', 'markers'), a = w('markers', 'all');
      st.marks = [cl((lf - t + 2) / 8), cl((lf - m2 + 2) / 8), cl((lf - a + 2) / 8)];
      st.line = cl((lf - w('markers', 'line') + 4) / 16);
      st.lift = 0.9 * cl((lf - w('markers', 'sticks') + 3) / 10);
      P.push({who: 'wallace', p: [90, 0, FZ], ...seq(lf, [[0, 'point', 'happy'], [w('markers', 'If') - 2, 'present', 'neutral']]), gaze: [60, 2, -262.3]});
      break;
    }
    case 'scope': {
      fenDone();
      P.push({who: 'wallace', p: [93.8, 0, FZ - 0.3], ...seq(lf, [[0, 'think', 'neutral'], [w('scope', 'sticking') - 4, 'eureka', 'surprised']]), gaze: [90, 1, -262]});
      break;
    }
    case 'win': {
      fenDone();
      const wn = w('win', 'Wallace');
      P.push({who: 'shopper2', p: [90.6, 0, FZ - 0.5], ...seq(lf, [[0, 'idle', 'neutral'], [w('win', 'called') - 4, 'point', 'neutral'], [wn - 2, 'cheer', 'happy']]), gaze: [92.2, 1, FZ]});
      P.push({who: 'wallace', p: [92.2, 0, FZ], ...seq(lf, [[0, 'idle', 'neutral'], [wn + 2, 'cheer', 'grin']])});
      P.push({who: 'hampden', p: [88.9, 0, FZ - 0.2], ...seq(lf, [[0, 'cross', 'smug'], [wn, 'idle', 'shock']]), gaze: [90.6, 1, FZ - 0.5]});
      break;
    }
    case 'fraud': {
      fenDone(); st.fraud = cl((lf - w('fraud', 'fraud') + 4) / 6);
      P.push({who: 'hampden', p: [88.9, 0, FZ - 0.2], ...seq(lf, [[0, 'cross', 'angry'], [w('fraud', 'called') - 4, 'point', 'rage']]), gaze: [92.2, 1, FZ], talk: lf > w('fraud', 'called') - 2});
      P.push({who: 'wallace', p: [92.2, 0, FZ], ...seq(lf, [[0, 'idle', 'surprised']])});
      break;
    }
    // ---------------- street: the letters ----------------
    case 'letters': {
      st.letters = (lf - 4) / 30;
      st.letter = cl((lf - w('letters', 'Your') + 4) / 8);
      P.push({who: 'mrswallace', p: [-21.9, 0, 5.0], ...seq(lf, [[0, 'idle', 'surprised'], [w('letters', 'wife') - 4, 'idle', 'worried'], [w('letters', 'Your'), 'idle', 'shock']]), gaze: [-22.7, 0.5, 4.6]});
      P.push({who: 'wallace', p: [-23.7, 0, 5.1], ...seq(lf, [[0, 'idle', 'surprised'], [w('letters', 'friends'), 'idle', 'worried']]), gaze: [-22.7, 0.5, 4.6]});
      break;
    }
    case 'years': {
      st.letters = lf / 30 + 6;
      st.year = 1871 + Math.min(14, Math.floor(lf / 9));
      P.push({who: 'wallace', p: [-23.0, 0, 5.2], ...seq(lf, [[0, 'tired', 'tired'], [w('years', 'never') - 4, 'shrug', 'sad']]), sweat: lf < w('years', 'never'), gaze: 'cam'});
      break;
    }
    // ---------------- jail ----------------
    case 'prison': {
      st.loc = 'jail'; st.bars = cl(lf / 14);
      st.jailDisc = cl((lf - w('prison', 'earth') + 4) / 8) * (1 - cl((lf - w('prison', 'threatening') + 2) / 6));
      P.push({who: 'hampden', p: [-0.3, 0, JZ - 0.2], ...seq(lf, [[0, 'cross', 'angry'], [w('prison', 'Not') - 4, 'slump', 'sad'], [w('prison', 'threatening') - 2, 'tired', 'tired']])});
      P.push({who: 'cop', p: [1.25, 0, JZ + 2.2], ...seq(lf, [[0, 'cross', 'smug']]), gaze: [-0.3, 1, JZ - 0.2]});
      break;
    }
  }
  autoGaze(P, []);
  return st;
}
