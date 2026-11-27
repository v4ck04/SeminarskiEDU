// 02_piggly_wiggly solids for the checkers + gate waivers (every waiver needs a reason the user accepted).
import {townSolids} from '../../engine/kits/downtown/townData';
type Box = [number, number, number, number, number, number, string];
const P0 = -110;
/** the grocery shell + aisle gondolas (camera must stay inside the room / out of the shelves) */
const STORE: Box[] = [
  [-4.3, -3.95, 0, 3.7, -14, 4.1, 'store wall L'], [3.95, 4.3, 0, 3.7, -14, 4.1, 'store wall R'], [-4.3, 4.3, 0, 3.7, -14.4, -13.95, 'store wall back'],
  [-4.3, -1.25, 0, 4.8, 3.95, 4.3, 'store front L'], [1.25, 4.3, 0, 4.8, 3.95, 4.3, 'store front R'], [-1.25, 1.25, 2.6, 4.8, 3.95, 4.3, 'store front top'],
  [-4.3, 4.3, 3.62, 4.0, -14.4, 4.1, 'store ceiling'],
  [-1.58, -1.1, 0, 2.3, -11.9, -2.2, 'shelf L'], [1.1, 1.58, 0, 2.3, -11.9, -2.2, 'shelf R'],
];
const TURN: Box[] = [[-0.42, -0.18, 0, 0.62, 3.28, 3.52, 'turnstile'], [0.75, 0.85, 0, 0.62, 2.45, 3.45, 'turnstile rail']];
const PALACE: Box[] = [[-6.5, 6.5, 0, 11, P0 - 5, P0 + 5, 'palace'], [-16.5, 16.5, 0, 7.5, P0 - 5.2, P0 + 3.4, 'palace wings'], [-3.5, 3.5, 0, 9.8, P0 + 5, P0 + 8.1, 'portico']];
export const SOLIDS: Box[] = [...townSolids(), ...STORE, ...PALACE];
export const LOGIC_SOLIDS: Box[] = [...townSolids().filter((b) => b[2] < 1.0 && !b[6].startsWith('far car')), ...STORE.filter((b) => b[2] < 1), ...TURN, ...PALACE];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
