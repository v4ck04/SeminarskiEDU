// 02_piggly_wiggly camera: one continuous take per beat (03_CAMERA_GRAMMAR: travel on the word, push-in default,
// hard cuts only at place/time changes or a punchline). Keys: K(at, subject(s), size, az, el, fov, opts).
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';
const P0 = -110;
export const PROPS: Props = {
  cans: [[-0.27, 0.82, -0.43], [0.38, 0.14, 0.1]],
  aisle: [[0, 1.1, -6.2], [1.5, 1.1, 3.6]],
  prices: [[-1.13, 0.85, -3.3], [0.05, 0.45, 0.75]],
  turnstile: [[-0.1, 0.4, 3.0], [0.6, 0.4, 0.5]],
  sign: [[0, 3.7, 4.27], [1.95, 0.5, 0.05]],
  street: [[0, 3.4, 6.2], [11, 1.8, 2.2]],
  street2: [[0, 4.5, 12], [34, 3.5, 8]],
  palace: [[0, 5.0, P0 + 8.6], [7.2, 4.8, 0.4]],
  board: [[22.4, 1.55, 6.6], [1.25, 0.95, 0.1]],
  sold: [[3.4, 1.0, P0 + 12.5], [0.8, 0.6, 0.1]],
  ropes: [[0, 0.5, 2.1], [2.4, 0.4, 0.1]],
};
export const TAKES: Take[] = [
  {name: 'hook', why: 'cold open on the strange action: a shopper helping herself, pull back to the proud owner', keys: [
    K(R.hook, 'woman', 'MS', 12, 4, 40, {push: 1.06}),
    K(T('hook', 'take'), ['woman', 'goldman', 'kid'], 'FS', 8, 9, 50, {move: 'arc', dur: 0.9}),
    K(T('hook', 'wanted'), 'goldman', 'MCU', 5, 3, 40, {move: 'arc', dur: 0.6, push: 1.05})]},
  {name: 'before', why: 'counter service: the counter blocks the shelves, the queue waits', keys: [
    K(R.before, ['grandma', 'clerk'], 'FS', -10, 14, 52, {push: 1.04}),
    K(T('before', 'clerk'), 'clerk', 'MS', -8, 6, 40, {move: 'arc', dur: 0.7}),
    K(T('before', 'waited'), ['shopper2', 'shopper', 'man'], 'FS', 180, 8, 50, {move: 'pullpush', bump: 0.1, dur: 0.8}),
    K(T('before', 'One'), ['clerk', 'prop:cans'], 'MS', 192, 12, 44, {move: 'arc', dur: 0.5, push: 1.06})]},
  {name: 'rip', why: 'hard cut: he shoves the whole counter out of frame', keys: [
    K(R.rip, 'goldman', 'FS', 28, 6, 56, {push: 1.0, track: 2}),
    K(T('rip', 'counter'), 'goldman', 'MS', 5, 4, 40, {move: 'arc', dur: 0.6})]},
  {name: 'open', why: 'the new store: open aisle, then the price cards', keys: [
    K(R.open, 'prop:aisle', 'FS', 0, 12, 50, {crane: -4, arc: 0}),
    K(T('open', 'price'), 'prop:prices', 'MS', 40, 2, 46, {move: 'arc', dur: 0.7, push: 1.05})]},
  {name: 'turn', why: 'turnstile at the door, shot from inside so she walks at us', keys: [
    K(R.turn, ['woman', 'prop:turnstile'], 'FS', 170, 8, 42, {push: 1.04})]},
  {name: 'grab', why: 'basket + serve yourself at the shelf', keys: [
    K(R.grab, 'woman', 'MS', 55, 4, 40, {push: 1.05}),
    K(T('grab', 'serve'), 'woman', 'MCU', 40, 3, 40, {move: 'arc', dur: 0.5})]},
  {name: 'pay', why: 'pay on the way out at the till', keys: [
    K(R.pay, 'woman', 'MS', 100, 6, 50, {push: 1.04})]},
  {name: 'laugh', why: 'street: rival grocers mock him from their doors (shot along the sidewalk: the vertical frame wants depth)', keys: [
    K(R.laugh, ['grocer1', 'goldman', 'grocer2'], 'FS', 0, 7, 46, {push: 1.04}),
    K(T('laugh', "They'll"), 'grocer1', 'MCU', -20, 3, 40, {move: 'arc', dur: 0.7}),
    K(T('laugh', 'Nobody'), 'grocer2', 'MCU', 20, 3, 40, {move: 'whip', dur: 0.35})]},
  {name: 'name', why: 'tilt up to the odd name, then his answer straight to the lens', keys: [
    K(R.name, 'goldman', 'MS', 0, 5, 40),
    K(T('name', 'sign'), 'prop:sign', 'CU', 0, -12, 55, {move: 'pan', dur: 0.6, push: 1.04}),
    K(T('name', 'Why'), ['shopper2', 'goldman'], 'MS', -22, 4, 40, {move: 'pullpush', bump: 0.2, dur: 0.6}),
    K(T('name', 'So'), 'goldman', 'MCU', 0, 3, 40, {move: 'arc', dur: 0.5, push: 1.06})]},
  {name: 'grow', why: 'growth in threes: him, then down the street, then the whole town from high up', keys: [
    K(R.grow, 'goldman', 'MS', 0, 6, 40),
    K(T('grow', 'hundred'), 'pos:-1,3.6,4.5,5', 'FS', 50, 12, 48, {move: 'pullpush', bump: 0.1, dur: 0.8}),
    K(T('grow', 'thousand'), 'pos:4,3.6,6,12', 'FS', 75, 24, 54, {move: 'dolly', dur: 1.0})]},
  {name: 'copy', why: 'karma: the mockers drag out their own counters', keys: [
    K(R.copy, ['grocer1', 'pos:-7.35,0.5,5.9,0.8'], 'FS', -82, 8, 50, {push: 1.03})
  ]},
  {name: 'copy_b', why: 'hard cut to the second mocker doing the same', keys: [
    K(T('copy', 'Ripped'), ['grocer2', 'pos:7.25,0.5,5.9,0.8'], 'FS', 82, 8, 50, {push: 1.03})]},
  {name: 'palace', why: 'hard cut: from him up to the pink palace under construction', keys: [
    K(R.palace, 'goldman', 'MS', 0, 3, 40),
    K(T('palace', 'pink'), 'prop:palace', 'FS', 8, 8, 48, {move: 'pullpush', bump: 0.15, dur: 1.0, crane: 4})]},
  {name: 'wall', why: 'Wall Street: the board drives the beat', keys: [
    K(R.wall, ['banker', 'banker2', 'banker3', 'prop:board'], 'FS', 0, 7, 44),
    K(T('wall', 'He'), 'goldman', 'MS', 22, 4, 40, {move: 'arc', dur: 0.7}),
    K(T('wall', 'winning'), ['goldman', 'prop:board'], 'FS', 8, 6, 44, {move: 'pullpush', bump: 0.15, dur: 0.6}),
    K(T('wall', 'changed'), 'prop:board', 'MS', 0, 3, 40, {move: 'arc', dur: 0.35, push: 1.07})]},
  {name: 'lost', why: 'back at the palace: alone, the creditors sign', keys: [
    K(R.lost, 'goldman', 'MS', 0, 4, 40, {push: 1.05}),
    K(T('lost', 'palace'), ['goldman', 'banker', 'prop:sold'], 'FS', -12, 6, 44, {move: 'pullpush', bump: 0.2, dur: 0.8})]},
  {name: 'today', why: 'same place today: a museum, kids walking in', keys: [
    K(R.today, ['teacher', 'kid', 'paperboy'], 'FS', 12, 8, 44),
    K(T('today', 'museum'), 'prop:palace', 'FS', 0, 6, 48, {move: 'pullpush', bump: 0.15, dur: 0.8})]},
  {name: 'replica', why: 'inside: visitors behind the ropes', keys: [
    K(R.replica, ['teacher', 'paperboy'], 'FS', 160, 9, 44)]},
  {name: 'replica_b', why: 'cut over their shoulders into the roped-off copy of the first store', keys: [
    K(T('replica', 'full-size'), 'prop:aisle', 'FS', 0, 12, 50, {push: 1.05})]},
  {name: 'replica_c', why: 'punchline: the kid takes the turnstile', keys: [
    K(T('replica', 'Turnstile'), ['kid', 'prop:turnstile'], 'FS', 170, 7, 42, {push: 1.05})]},
];
export const KICKS: Kick[] = [
  {t: T('before', 'One'), a: 0.6, z: 0.01}, {t: T('before', 'Item'), a: 0.6, z: 0.01}, {t: T('before', 'time'), a: 0.6, z: 0.01},
  {t: T('rip', 'ripped'), a: 1.2, z: 0.02}, {t: T('wall', 'changed'), a: 1.0, z: 0.02},
];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [];
