// 03_flat_earth_bet solids for the checkers + gate waivers (every waiver needs a reason the user accepted).
import {townSolids} from '../../engine/kits/downtown/townData';
type Box = [number, number, number, number, number, number, string];
const JZ = -420, FZ = -260;
const JAIL: Box[] = [[-1.9, 1.9, 0, 3.0, JZ - 1.6, JZ - 1.2, 'jail back'], [-1.9, -1.6, 0, 3.0, JZ - 1.3, JZ + 1.3, 'jail L'], [1.6, 1.9, 0, 3.0, JZ - 1.3, JZ + 1.3, 'jail R'],
  [-6, 6, 0, 5.6, JZ + 6.8, JZ + 7.1, 'corridor wall'], [-6, 6, 5.4, 5.7, JZ - 2.5, JZ + 7.5, 'jail ceiling']];
const BARS: Box = [-1.7, 1.7, 0, 2.8, JZ + 1.25, JZ + 1.35, 'bars'];   // logic only: the camera looks through the bars on purpose
const FEN: Box[] = [[-180, 180, -1, 0.0, FZ - 2.5, FZ + 2.5, 'canal'], [37.6, 42.4, 0, 10, FZ - 42.4, FZ - 37.6, 'windmill']];
export const SOLIDS: Box[] = [...townSolids(), ...JAIL, ...FEN];
export const LOGIC_SOLIDS: Box[] = [...townSolids().filter((b) => b[2] < 1.0 && !b[6].startsWith('far car')), ...JAIL.filter((b) => b[2] < 1), BARS, [-180, 180, -1, 0.5, FZ - 2.6, FZ + 2.6, 'canal']];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
