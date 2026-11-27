// 03_flat_earth_bet camera: one continuous take per beat; hard cuts at place/time changes, the scope view and the letter.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';
export const PROPS: Props = {
  disc: [[22.4, 2.55, 6.0], [0.8, 0.45, 0.8]],
  paper: [[22.4, 1.3, 7.3], [0.42, 0.56, 0.05]],
  markers: [[0, 2.4, -262.3], [21, 1.6, 0.5]],
  mid: [[0, 2.9, -262.3], [2.6, 1.0, 0.5]],
  scope: [[93, 0.9, -256.3], [0.5, 0.5, 0.4]],
  fraud: [[88.25, 1.6, -255.9], [0.42, 0.24, 0.05]],
  door: [[-22.7, 1.2, 4.5], [1.6, 1.2, 0.5]],
  letter: [[-22.35, 1.3, 5.75], [0.38, 0.28, 0.03]],
  year: [[-21.5, 2.15, 4.3], [0.65, 0.38, 0.05]],
  cell: [[0, 1.3, -420], [1.7, 1.3, 1.3]],
};
export const TAKES: Take[] = [
  {name: 'hook', why: 'the bettor with his placard, then the man who regretted taking it', keys: [
    K(R.hook, ['hampden', 'pos:23.05,1.4,6.15,0.5'], 'MS', 10, 4, 42, {push: 1.04}),
    K(T('hook', 'man'), 'wallace', 'MCU', -15, 3, 40, {move: 'arc', dur: 0.6})]},
  {name: 'idea', why: 'the flat disc pops out of his head; push to the ice wall', keys: [
    K(R.idea, 'hampden', 'MS', 0, 4, 40),
    K(T('idea', 'flat'), ['hampden', 'prop:disc'], 'MS', 0, 8, 44, {move: 'pullpush', bump: 0.1, dur: 0.6}),
    K(T('idea', 'ice'), 'prop:disc', 'MS', 0, 24, 40, {move: 'arc', dur: 0.6, push: 1.08})]},
  {name: 'offer', why: 'the £500 newspaper flies at the lens', keys: [
    K(R.offer, 'prop:paper', 'MS', 0, 2, 40, {push: 1.05}),
    K(T('offer', 'anyone'), ['hampden', 'prop:paper'], 'FS', 15, 5, 44, {move: 'pullpush', bump: 0.1, dur: 0.7})]},
  {name: 'laugh', why: 'passers-by laugh; travel to the one man who does not', keys: [
    K(R.laugh, ['man', 'youngman', 'woman'], 'FS', 0, 6, 46, {push: 1.04}),
    K(T('laugh', 'One'), 'wallace', 'MS', -10, 4, 40, {move: 'arc', dur: 0.7}),
    K(T('laugh', 'greatest'), 'wallace', 'MCU', 0, 3, 40, {move: 'arc', dur: 0.5, push: 1.06})]},
  {name: 'canal', why: 'hard cut to the fen; rise and look down the dead-straight canal', keys: [
    K(R.canal, 'pos:93,0.8,-256,5', 'FS', 30, 25, 46),
    K(T('canal', 'six'), 'pos:20,0,-260,25', 'FS', 86, 12, 50, {move: 'dolly', dur: 1.4})]},
  {name: 'markers', why: 'three markers pop up, then line up end-on; the middle one sticks up', keys: [
    K(R.markers, 'pos:0,2.8,-262.3,21', 'FS', 8, 4, 74),
    K(T('markers', 'sticks'), 'pos:0,3.0,-262.3,5', 'FS', 8, 3, 50, {move: 'dolly', dur: 0.6, push: 1.05})]},
  {name: 'scope', why: 'Wallace bends to the telescope', keys: [
    K(R.scope, ['wallace', 'prop:scope'], 'MS', 30, 4, 42, {push: 1.05})]},
  {name: 'scope_b', why: 'the view through the telescope (HUD eyepiece)', keys: [
    K(T('scope', 'middle') - 0.1, 'pos:0,3.0,-262.3,2.6', 'FS', 76, 0, 12, {arc: 0, push: 1.03})]},
  {name: 'win', why: 'the referee calls it', keys: [
    K(R.win, ['shopper2', 'wallace', 'hampden'], 'FS', 0, 6, 44, {push: 1.04}),
    K(T('win', 'Wallace'), 'wallace', 'MCU', 10, 3, 40, {move: 'arc', dur: 0.5})]},
  {name: 'fraud', why: 'Hampden refuses: FRAUD!', keys: [
    K(R.fraud, 'hampden', 'MCU', -10, 3, 40, {push: 1.06}),
    K(T('fraud', 'fraud'), ['hampden', 'prop:fraud'], 'MS', -5, 4, 42, {move: 'pullpush', bump: 0.1, dur: 0.4})]},
  {name: 'letters', why: 'letters rain on the Wallaces door', keys: [
    K(R.letters, 'prop:door', 'FS', 20, 8, 46),
    K(T('letters', 'wife'), ['mrswallace', 'wallace'], 'MS', 10, 4, 42, {move: 'arc', dur: 0.6})]},
  {name: 'letters_b', why: 'insert: the letter itself', keys: [
    K(T('letters', 'Your') - 0.05, 'prop:letter', 'MS', 0, 2, 40, {push: 1.05})]},
  {name: 'years', why: 'years flip by; he never sees the money', keys: [
    K(R.years, ['wallace', 'prop:year'], 'MS', 0, 5, 44, {push: 1.05}),
    K(T('years', 'never'), 'wallace', 'MCU', 0, 3, 40, {move: 'arc', dur: 0.5})]},
  {name: 'prison', why: 'karma: the bars close on Hampden; push in on the last words', keys: [
    K(R.prison, 'prop:cell', 'FS', 0, 6, 66),
    K(T('prison', 'Not'), 'hampden', 'MS', 0, 4, 42, {move: 'arc', dur: 0.7}),
    K(T('prison', 'threatening'), 'hampden', 'MCU', 0, 3, 40, {move: 'arc', dur: 0.6, push: 1.06})]},
];
export const KICKS: Kick[] = [
  {t: T('win', 'wins'), a: 0.8, z: 0.015}, {t: T('fraud', 'fraud'), a: 1.0, z: 0.02}, {t: R.prison + 0.45, a: 1.2, z: 0.02},
];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [];
