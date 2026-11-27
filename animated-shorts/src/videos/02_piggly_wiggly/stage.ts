// 02_piggly_wiggly staging: who / what is where per frame (identity timeline: staging frame = voice frame).
// Places: the store (x -4..4, z -14..4, door at z 4), the downtown street (sidewalk z 4.25-8.3), the palace grounds (PALACE = (0, 0, -110)).
import {TOTAL, shotAt, W, cl, sm01, type V3} from '../../engine/core/clock';
import {autoGaze} from '../../engine/core/staging';
import {PersonP, seq, type ActName} from '../../engine/chars/rig';
import type {Expr} from '../../engine/chars/charparts';
import type {CarP, MeterP, Things} from '../../engine/kits/downtown/street';
import type {CartP} from '../../engine/kits/grocery/store';
export {TOTAL, shotAt};

export type CounterS = {p: V3; len: number; cans?: number; ry?: number};
export type Stage = {people: PersonP[]; carts: CartP[]; extra: string[]; cars: CarP[]; meters: MeterP[]; things: Things; clock: number; nStoryCars: number;
  loc: 'store' | 'street' | 'palace'; counters: CounterS[]; spin: number; turnstile: boolean; ropes: boolean; signs: Record<string, number>;
  palace: 'build' | 'done' | 'museum'; sold: number; board?: {prog: number; stamp: number}; exchange: boolean; rivals: boolean};

/** walk along keys [[frame, x, z], ...] (smooth-stepped segments); returns position + whether moving */
function mv(lf: number, keys: [number, number, number][]): {p: V3; moving: boolean} {
  if (lf <= keys[0][0]) return {p: [keys[0][1], 0, keys[0][2]], moving: false};
  for (let i = 1; i < keys.length; i++) if (lf < keys[i][0]) { const [a, x0, z0] = keys[i - 1], [b, x1, z1] = keys[i], u = (lf - a) / (b - a), e = u;   // linear inside a leg = steady walk
    const still = x0 === x1 && z0 === z1; return {p: [x0 + (x1 - x0) * e, 0, z0 + (z1 - z0) * e], moving: !still}; }
  const k = keys[keys.length - 1]; return {p: [k[1], 0, k[2]], moving: false};
}
/** person that walks when moving and plays `still` (act/expr list) otherwise */
function walker(who: PersonP['who'], lf: number, keys: [number, number, number][], still: [number, ActName, Expr?][], o: Partial<PersonP> = {}): PersonP {
  const m = mv(lf, keys);
  return m.moving ? {who, p: m.p, act: 'walk', expr: (o.expr ?? 'neutral') as Expr, ...o} : {who, p: m.p, ...seq(lf, still), ...o};
}
const w = (shot: string, word: string) => W(shot, word);   // local frame of a word in its shot

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, P: PersonP[] = [], K: CarP[] = [], C: CounterS[] = [], sg: Record<string, number> = {};
  const st: Stage = {people: P, carts: [], extra: [], cars: K, meters: [], things: {}, clock: 9.5, nStoryCars: 0,
    loc: 'store', counters: C, spin: 0, turnstile: true, ropes: false, signs: sg, palace: 'build', sold: 0, exchange: false, rivals: true};
  const street = () => { st.loc = 'street'; K.push({p: [-11.25, 0, 9.45], ry: Math.PI, col: '#2f4f6a'}, {p: [15.75, 0, 9.45], ry: Math.PI, col: '#a8443a'}, {p: [29.25, 0, 9.45], ry: Math.PI, col: '#3f6a4a'}); };
  switch (s.name) {
    // ---------------- store, self-service ----------------
    case 'hook': {
      P.push({who: 'woman', p: [-0.75, 0, -2.5], basket: true, ...seq(lf, [[0, 'idle', 'happy'], [w('hook', 'take') - 6, 'point', 'grin']]), gaze: [-1.3, 1, -2.7]});
      P.push(walker('shopper', lf, [[0, 0.3, -5.6], [60, 0.35, -8.2]], [[0, 'idle', 'happy']], {basket: true, expr: 'happy'}));
      P.push({who: 'kid', p: [1.6, 0, 0.6], ...seq(lf, [[0, 'idle', 'surprised'], [w('hook', 'wanted') - 10, 'bounce', 'grin']])});
      P.push({who: 'goldman', p: [0.9, 0, -0.4], ...seq(lf, [[0, 'idle', 'smug'], [w('hook', 'take'), 'proud', 'proud']]), gaze: 'cam'});
      st.spin = 0; break;
    }
    // ---------------- store, counter service ----------------
    case 'before': {
      st.turnstile = false;
      const wt = w('before', 'waited'), o1 = w('before', 'One'), o2 = w('before', 'Item'), o3 = w('before', 'time');
      C.push({p: [0, 0, -0.55], len: 6.6, cans: lf >= o3 ? 3 : lf >= o2 ? 2 : lf >= o1 ? 1 : 0});
      // the clerk fetches each item from the back shelves
      P.push(walker('clerk', lf, [[0, 0.5, -1.25], [wt - 4, 0.5, -1.25], [wt + 26, 0.05, -3.1], [wt + 30, 0.05, -3.1], [o1 - 2, 0.5, -1.25]],
        [[0, 'talk', 'fake'], [w('before', 'read') - 4, 'idle', 'neutral'], [o1 - 2, 'present', 'tired'], [o2, 'present', 'tired'], [o3, 'present', 'tired']], {gaze: [-1.0, 1, 0.25], expr: 'tired'}));
      P.push({who: 'grandma', p: [-1.0, 0, 0.25], ...seq(lf, [[0, 'talk', 'neutral'], [wt - 6, 'cross', 'tired'], [o1, 'tired', 'tired']]), gaze: [0.5, 1, -1.25], talk: lf < wt - 6});
      P.push({who: 'shopper2', p: [1.25, 0, 0.85], ...seq(lf, [[0, 'idle', 'neutral'], [wt, 'tired', 'tired']]), gaze: [-1.0, 1, 0.25]});
      P.push({who: 'shopper', p: [2.0, 0, 1.45], basket: true, ...seq(lf, [[0, 'idle', 'neutral'], [wt + 8, 'slump', 'tired']]), gaze: [-1.0, 1, 0.25]});
      P.push({who: 'man', p: [2.7, 0, 2.1], ...seq(lf, [[0, 'cross', 'angry']]), gaze: [-1.0, 1, 0.25]});
      break;
    }
    case 'rip': {
      st.turnstile = false;
      const r0 = w('rip', 'ripped'), u = cl((lf - r0) / 36), x = 8.5 * u * u;   // counter slides off to +x (cartoon: through the wall)
      C.push({p: [x, 0, -0.55], len: 6.6, cans: 3});
      const gx = -3.65 + Math.min(x, 1.4);
      P.push({who: 'goldman', p: [gx, 0, -0.55], ...(lf < r0 - 4 ? {act: 'idle', expr: 'smug'} : x < 1.4 ? {act: 'push', expr: 'rage'} : seq(lf - r0, [[0, 'push', 'rage'], [22, 'proud', 'proud']])), view: lf >= r0 - 4 && x < 1.4 ? 'side' : 'front', dir: 1});
      P.push({who: 'clerk', p: [0.9, 0, -1.6], ...seq(lf, [[0, 'idle', 'neutral'], [r0 + 6, 'idle', 'shock']]), gaze: [gx, 1, -0.55]});
      break;
    }
    case 'open': {   // open shelves / a price on every can: browsing in the aisle
      P.push(walker('grandma', lf, [[0, -0.3, -5.5], [w('open', 'price') + 10, -0.35, -3.4]], [[0, 'point', 'happy']], {basket: true, expr: 'happy', gaze: [-1.3, 1, -3.4]}));
      P.push({who: 'shopper2', p: [0.55, 0, -6.6], basket: true, ...seq(lf, [[0, 'idle', 'happy'], [20, 'point', 'grin']]), gaze: [1.3, 1, -6.8]});
      P.push({who: 'kid', p: [0.2, 0, -4.4], ...seq(lf, [[0, 'idle', 'surprised']]), gaze: [1.3, 1, -4.2]});
      break;
    }
    case 'turn': {   // a turnstile at the door: she walks in, the arms turn
      const m = mv(lf, [[0, 0.25, 5.4], [s.len - 2, 0.25, 2.5]]);
      P.push({who: 'woman', p: m.p, act: m.moving ? 'walk' : 'idle', expr: 'surprised', view: 'front'});
      st.spin = cl((m.p[2] - 3.75) / -0.8) * (2 * Math.PI / 3);
      break;
    }
    case 'grab': {   // grab a basket, serve yourself
      st.spin = 2 * Math.PI / 3;
      P.push({who: 'woman', p: [-0.6, 0, -2.75], basket: true, ...seq(lf, [[0, 'present', 'happy'], [w('grab', 'serve') - 2, 'point', 'grin']]), gaze: [-1.3, 1, -3.0]});
      break;
    }
    case 'pay': {   // pay on the way out: the till by the door
      st.spin = 2 * Math.PI / 3;
      P.push({who: 'clerk', p: [-2.55, 0, 0.75], ...seq(lf, [[0, 'talk', 'happy']]), gaze: [-2.3, 1, 2.45]});
      P.push({who: 'woman', p: [-2.15, 0, 2.45], basket: true, ...seq(lf, [[0, 'present', 'happy']]), gaze: [-2.55, 1, 0.75]});
      break;
    }
    // ---------------- street ----------------
    case 'laugh': {
      street();
      const a = w('laugh', "They'll"), b = w('laugh', 'Nobody');
      P.push({who: 'goldman', p: [0.0, 0, 5.2], ...seq(lf, [[0, 'proud', 'proud'], [b + 10, 'shrug', 'smug']])});
      P.push({who: 'grocer1', p: [-1.45, 0, 5.75], ...seq(lf, [[0, 'idle', 'grin'], [a - 4, 'point', 'grin']]), talk: lf >= a && lf < b, gaze: [0, 1, 5.2]});
      P.push({who: 'grocer2', p: [1.5, 0, 5.8], ...seq(lf, [[0, 'shrug', 'grin'], [b - 4, 'talk', 'grin']]), talk: lf >= b, gaze: [0, 1, 5.2]});
      break;
    }
    case 'name': {
      street();
      const why = w('name', 'Why'), so = w('name', 'So');
      P.push({who: 'goldman', p: [0.0, 0, 5.3], ...seq(lf, [[0, 'proud', 'proud'], [so - 2, 'talk', 'smug'], [w('name', 'question') - 4, 'wink', 'wink']]), talk: lf >= so && lf < w('name', 'question') + 8, gaze: lf >= so ? 'cam' : [1.0, 1, 5.9]});
      P.push({who: 'shopper2', p: [1.05, 0, 5.95], ...seq(lf, [[0, 'idle', 'neutral'], [why - 4, 'shrug', 'worried']]), talk: lf >= why && lf < why + 10, gaze: [0, 1, 5.3]});
      break;
    }
    case 'grow': {
      street(); st.rivals = false;
      const h = w('grow', 'hundred'), t = w('grow', 'thousand');
      ['HATS', 'DRUG', 'BARBER', 'BOOKS', 'LAUNDRY', 'MUSIC'].forEach((n, i) => { sg[n] = cl((lf - h - i * 1.5) / 6); });
      ['HARDWARE', 'FIVE', 'SHOES', 'CAFE', 'TAILOR', 'DINER', 'TOYS', 'FLORIST', 'JEWELER', 'RADIO', "MEN'S", 'OFFICE', 'BAKERY', 'NEWS', 'FURNITURE', 'INSURANCE', 'DEPARTMENT', 'GARAGE', 'RIALTO', 'BANK', 'HOTEL LEE', 'KINGKADE']
        .forEach((n, i) => { sg[n] = cl((lf - t - i * 0.5) / 6); });
      P.push({who: 'goldman', p: [0.0, 0, 5.3], ...seq(lf, [[0, 'proud', 'proud'], [h, 'cheer', 'grin']]), gaze: 'cam'});
      P.push(walker('woman', lf, [[0, -3, 6.8], [90, 3.5, 6.9]], [[0, 'idle', 'happy']], {basket: true, expr: 'happy'}));
      P.push(walker('youngman', lf, [[0, 7, 7.7], [90, 1.2, 7.7]], [[0, 'idle', 'happy']], {expr: 'happy'}));
      break;
    }
    case 'copy': {
      street();
      const r = w('copy', 'Ripped'), u1 = cl(lf / 60), u2 = cl((lf - r + 6) / 40);
      const z1 = 5.2 + 1.5 * sm01(u1), z2 = 5.2 + 1.5 * sm01(u2);
      C.push({p: [-7.35, 0, z1], len: 1.5}, {p: [7.25, 0, z2], len: 1.5});
      P.push({who: 'grocer1', p: [-7.35, 0, z1 - 0.62], act: u1 > 0 && u1 < 1 ? 'push' : 'slump', expr: 'sad'});
      P.push({who: 'grocer2', p: [7.25, 0, z2 - 0.62], act: u2 > 0 && u2 < 1 ? 'push' : lf < r ? 'idle' : 'slump', expr: lf < r ? 'worried' : 'angry'});
      break;
    }
    case 'wall': {
      street(); st.exchange = true;
      const ag = w('wall', 'against'), bk = w('wall', 'back'), wn = w('wall', 'winning'), ch = w('wall', 'changed');
      const prog = lf < ag ? 0.05 : lf < bk - 10 ? 0.05 + 0.37 * cl((lf - ag) / 24) : lf < wn + 10 ? 0.42 + 0.58 * cl((lf - bk + 10) / (wn - bk + 16)) : 1;
      st.board = {prog, stamp: cl((lf - ch) / 6)};
      const bx = 22.4;
      P.push({who: 'banker', p: [bx - 1.7, 0, 7.15], ...seq(lf, [[0, 'cross', 'smug'], [bk, 'idle', 'worried'], [ch - 4, 'point', 'smug']]), sweat: lf >= bk && lf < ch, gaze: [bx, 1, 6.6]});
      P.push({who: 'banker2', p: [bx + 1.75, 0, 7.2], ...seq(lf, [[0, 'talk', 'smug'], [bk, 'idle', 'shock'], [ch, 'cross', 'smug']]), talk: lf < bk - 6, gaze: [bx - 1.7, 1, 7.15]});
      P.push({who: 'banker3', p: [bx + 0.6, 0, 7.75], ...seq(lf, [[0, 'idle', 'smug'], [bk + 6, 'idle', 'worried'], [ch + 2, 'proud', 'smug']]), gaze: [bx, 1, 6.6]});
      P.push({who: 'goldman', p: [bx - 3.6, 0, 7.35], ...seq(lf, [[0, 'idle', 'worried'], [bk - 6, 'flex', 'angry'], [wn - 4, 'cheer', 'grin'], [ch + 3, 'idle', 'shock']]), gaze: [bx, 1, 6.6]});
      break;
    }
    // ---------------- palace ----------------
    case 'palace': {
      st.loc = 'palace';
      P.push({who: 'goldman', p: [1.2, 0, -110 + 15.5], ...seq(lf, [[0, 'present', 'proud'], [w('palace', 'pink') - 4, 'proud', 'proud']]), gaze: 'cam'});
      break;
    }
    case 'lost': {
      st.loc = 'palace';
      st.sold = cl((lf - w('lost', 'palace') + 4) / 8);
      P.push({who: 'goldman', p: [1.2, 0, -110 + 15.5], ...seq(lf, [[0, 'slump', 'sad'], [w('lost', 'palace'), 'tired', 'sad']])});
      P.push({who: 'banker', p: [4.6, 0, -110 + 13.6], ...seq(lf, [[0, 'idle', 'smug'], [w('lost', 'palace') - 6, 'point', 'smug']]), gaze: [3.4, 1, -97.5]});
      break;
    }
    case 'today': {
      st.loc = 'palace'; st.palace = 'museum';
      P.push(walker('teacher', lf, [[0, -0.6, -110 + 18.5], [60, -0.6, -110 + 13.0]], [[0, 'point', 'happy']], {expr: 'happy'}));
      P.push(walker('kid', lf, [[0, 0.5, -110 + 18.0], [60, 0.4, -110 + 12.4]], [[0, 'bounce', 'grin']], {expr: 'grin'}));
      P.push(walker('paperboy', lf, [[0, 1.3, -110 + 19.0], [60, 1.2, -110 + 13.6]], [[0, 'idle', 'happy']], {expr: 'happy'}));
      break;
    }
    // ---------------- the replica inside the museum (the store set again, roped off) ----------------
    case 'replica': {
      st.ropes = true;
      const inc = w('replica', 'Turnstile');
      P.push({who: 'teacher', p: [-1.5, 0, 2.8], ...seq(lf, [[0, 'present', 'happy']]), gaze: [-1, 1, 0]});
      P.push({who: 'paperboy', p: [-0.75, 0, 3.5], ...seq(lf, [[0, 'idle', 'surprised']]), gaze: [0, 1, 0]});
      const m = mv(lf, [[inc - 22, 0.25, 4.9], [inc + 14, 0.25, 2.45]]);
      P.push({who: 'kid', p: m.p, act: m.moving ? 'walk' : 'cheer', expr: 'grin', view: 'front'});
      st.spin = cl((m.p[2] - 3.75) / -0.8) * (2 * Math.PI / 3);
      break;
    }
  }
  autoGaze(P, []);
  return st;
}
