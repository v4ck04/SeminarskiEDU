// ENGINE overlay: "like + subscribe" reminder card (slides in near the top, a cartoon hand taps LIKE then SUBSCRIBE, slides out).
// A story turns it on with `export const POPUPS = [{t: <real seconds>}]` in its set.tsx. Kept away from the caption band (70 %).
import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';

const INK = '#241726', FONT = '"Archivo Black", Impact, "Arial Black", sans-serif';
export type Popup = {t: number; dur?: number; channel?: string};
const ease = Easing.bezier(0.34, 1.56, 0.64, 1);   // back-out (small overshoot)

const Thumb: React.FC<{on: boolean; s: number}> = ({on, s}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 7.9 6 8.4 6 9v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z"
    fill={on ? '#2f7df6' : '#fbf3e0'} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /></svg>);
const Bell: React.FC<{s: number; ring: number}> = ({s, ring}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{transform: `rotate(${Math.sin(ring * 20) * 18 * Math.max(0, 1 - ring)}deg)`}}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.1-1.6-5.6-4.5-6.3V4c0-.8-.7-1.5-1.5-1.5S10.5 3.2 10.5 4v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z"
      fill="#f2b234" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /></svg>);
const Hand: React.FC<{s: number}> = ({s}) => (
  <svg width={s} height={s * 1.25} viewBox="0 0 40 50"><path d="M14 4c2 0 3.5 1.5 3.5 3.5V22l1-.2V18c0-1.9 1.5-3.3 3.3-3.3s3.3 1.4 3.3 3.3v3.3c.5-1.4 1.8-2.3 3.2-2.3 1.9 0 3.3 1.5 3.3 3.3v2c.5-.9 1.5-1.5 2.6-1.5 1.7 0 3 1.3 3 3V36c0 7-5 12-12 12h-4c-5 0-8-3-10.5-7L5 31c-1-1.6-.5-3.6 1.1-4.6 1.4-.8 3.1-.5 4.1.7l.3.4V7.5C10.5 5.5 12 4 14 4z"
    fill="#fdf9f6" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" /></svg>);

export const SubscribePopup: React.FC<{p: Popup; t: number; width: number; height: number}> = ({p, t, width, height}) => {
  const dur = p.dur ?? 3.0, lt = t - p.t; if (lt < 0 || lt > dur) return null;
  const k = width / 1080, inn = interpolate(lt, [0, 0.35], [0, 1], {extrapolateRight: 'clamp', easing: ease}), out = interpolate(lt, [dur - 0.3, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(inn - out, [0, 1], [-260, 0]) * k, liked = lt > 1.15, subbed = lt > 2.05;
  // hand path: enters from bottom-right -> LIKE (tap at 1.1 s) -> SUBSCRIBE (tap at 2.0 s) -> leaves
  const likeX = 235, subX = 545, hx = lt < 0.6 ? 900 : lt < 1.0 ? interpolate(lt, [0.6, 1.0], [900, likeX]) : lt < 1.35 ? likeX : lt < 1.85 ? interpolate(lt, [1.35, 1.85], [likeX, subX]) : subX;
  const tap = (c: number) => Math.max(0, 1 - Math.abs(lt - c) / 0.12), hy = 70 - 18 * Math.max(tap(1.1), tap(2.0)) + (lt > 2.5 ? (lt - 2.5) * 500 : 0);
  const press = (c: number) => 1 - 0.1 * tap(c), pop = (c: number) => (lt > c ? 1 + 0.15 * Math.max(0, 1 - (lt - c) / 0.25) : 1);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.1 + y, display: 'flex', justifyContent: 'center', opacity: 1 - out}}>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22 * k, padding: `${20 * k}px ${26 * k}px`, background: '#fbf3e0', border: `${7 * k}px solid ${INK}`, borderRadius: 40 * k,
          boxShadow: `0 ${10 * k}px 0 ${INK}`, fontFamily: FONT}}>
          <div style={{width: 92 * k, height: 92 * k, borderRadius: '50%', background: '#c8432a', border: `${6 * k}px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbf3e0', fontSize: 30 * k, lineHeight: 1}}>PW</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10 * k, padding: `${14 * k}px ${22 * k}px`, borderRadius: 30 * k, border: `${6 * k}px solid ${INK}`, background: liked ? '#d8e8ff' : '#fbf3e0',
            transform: `scale(${press(1.1) * pop(1.1)})`, fontSize: 40 * k, color: INK}}><Thumb on={liked} s={54 * k} />LIKE</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12 * k, padding: `${14 * k}px ${26 * k}px`, borderRadius: 30 * k, border: `${6 * k}px solid ${INK}`, background: subbed ? '#8a8494' : '#e8483a',
            transform: `scale(${press(2.0) * pop(2.0)})`, fontSize: 40 * k, color: '#fbf3e0'}}>{subbed ? 'SUBSCRIBED' : 'SUBSCRIBE'}{subbed && <Bell s={46 * k} ring={(lt - 2.05) / 0.8} />}</div>
          <div style={{position: 'absolute', left: hx * k, top: hy * k, opacity: lt < 0.6 || lt > 2.9 ? 0 : 1}}><Hand s={70 * k} /></div>
        </div>
      </div>
    </AbsoluteFill>);
};
