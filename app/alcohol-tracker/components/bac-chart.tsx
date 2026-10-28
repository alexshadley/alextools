'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Drink, Profile } from '../lib/bac';
import { simulate, zoneFor, ZONE_THRESHOLDS } from '../lib/bac';
import { formatBac, formatTime } from './ui';

export type ScrubPoint = { time: number; bac: number };

type Props = {
  drinks: Drink[];
  profile: Profile;
  now: number;
  onScrub: (p: ScrubPoint | null) => void;
};

const H = 270;
// Top padding holds the annotation rows: peak label, then up to three
// staggered rows of drink labels, each with a hairline leader down to its dot.
const PEAK_ROW_Y = 12;
const DRINK_ROW_Y = [32, 46, 60];
const PAD = { top: 72, right: 14, bottom: 26, left: 14 };
const FONT = 'var(--font-geist-sans), system-ui, sans-serif';
const MIN_MS = 60_000;
const DOMAIN_PAD_MS = 10 * MIN_MS;

// Marks wear the zone color at that BAC; text wears zinc text tokens.
type Pt = [number, number];
type Seg = { color: string; future: boolean; pts: Pt[] };

/**
 * Split the curve into runs that share a zone color and a past/future flag,
 * inserting interpolated points exactly where the curve crosses a threshold
 * so adjacent segments meet at the boundary.
 */
function splitByZone(curve: Pt[], nowIdx: number): Seg[] {
  const segs: Seg[] = [];
  const push = (a: Pt, b: Pt, future: boolean) => {
    const color = zoneFor((a[1] + b[1]) / 2).color;
    const last = segs[segs.length - 1];
    if (last && last.color === color && last.future === future) last.pts.push(b);
    else segs.push({ color, future, pts: [a, b] });
  };
  for (let i = 0; i + 1 < curve.length; i++) {
    const [t0, v0] = curve[i];
    const [t1, v1] = curve[i + 1];
    const future = i >= nowIdx;
    const lo = Math.min(v0, v1);
    const hi = Math.max(v0, v1);
    const crossings = ZONE_THRESHOLDS.filter((th) => th > lo && th < hi);
    if (v0 > v1) crossings.reverse();
    let prev: Pt = [t0, v0];
    for (const th of crossings) {
      const t = t0 + ((th - v0) / (v1 - v0)) * (t1 - t0);
      const pt: Pt = [t, th];
      push(prev, pt, future);
      prev = pt;
    }
    push(prev, [t1, v1], future);
  }
  return segs;
}
const SURFACE = '#ffffff';
const INK = { primary: '#18181b', secondary: '#52525b', muted: '#71717a', grid: '#d4d4d8' };

const hourLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric' }).replace(' ', ' ');

export function BacChart({ drinks, profile, now, onScrub }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    if (drinks.length === 0) return null;
    const lastDrink = Math.max(...drinks.map((d) => d.time));
    const horizon = Math.max(now, lastDrink) + 24 * 3_600_000;
    const full = simulate(drinks, profile, horizon);
    // Trim the flat zero tail: keep one point past the last non-zero minute.
    let lastNonZero = 0;
    for (let i = 0; i < full.length; i++) if (full[i][1] > 0) lastNonZero = i;
    const curve = full.slice(0, Math.min(full.length, lastNonZero + 2));

    let peakIdx = 0;
    for (let i = 1; i < curve.length; i++) if (curve[i][1] > curve[peakIdx][1]) peakIdx = i;

    const x0 = Math.min(curve[0][0], now) - DOMAIN_PAD_MS;
    const x1 = curve[curve.length - 1][0] + DOMAIN_PAD_MS;
    const yMax = Math.max(curve[peakIdx][1], 0.02) * 1.1;
    return { curve, peakIdx, x0, x1, yMax };
  }, [drinks, profile, now]);

  if (!model) {
    return (
      <div ref={wrapRef} className="flex h-40 items-center justify-center text-sm text-zinc-500">
        Add a drink to see your curve.
      </div>
    );
  }

  const { curve, peakIdx, x0, x1, yMax } = model;
  const W = width || 360;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - x0) / (x1 - x0)) * plotW;
  const y = (v: number) => PAD.top + (1 - v / yMax) * plotH;
  const baseline = y(0);
  const idxAt = (t: number) =>
    Math.min(curve.length - 1, Math.max(0, Math.round((t - curve[0][0]) / MIN_MS)));

  // Past / future split at `now`.
  const nowIdx = now >= curve[0][0] ? idxAt(now) : -1;
  const pathOf = (pts: Pt[]) =>
    pts.map(([t, v], i) => `${i === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const areaOf = (pts: Pt[]) =>
    pathOf(pts) +
    `L${x(pts[pts.length - 1][0]).toFixed(1)},${baseline}L${x(pts[0][0]).toFixed(1)},${baseline}Z`;
  const segments = splitByZone(curve, nowIdx);
  const thresholds = ZONE_THRESHOLDS.filter((th) => th < yMax);

  // Hour ticks along the bottom.
  const spanH = (x1 - x0) / 3_600_000;
  const stepH = spanH <= 6 ? 1 : spanH <= 12 ? 2 : spanH <= 24 ? 4 : 8;
  const ticks: number[] = [];
  {
    const d = new Date(x0);
    d.setMinutes(0, 0, 0);
    let t = d.getTime();
    if (t < x0) t += 3_600_000;
    // Align multi-hour steps to the clock hour.
    while (new Date(t).getHours() % stepH !== 0) t += 3_600_000;
    for (; t <= x1; t += stepH * 3_600_000) ticks.push(t);
  }

  // Drink annotations: dot on the curve + label, staggered on two rows when crowded.
  type Label = { cx: number; cy: number; tx: number; text: string; row: number; color: string };
  const labels: Label[] = [];
  const rowEnd = DRINK_ROW_Y.map(() => -Infinity);
  const sortedDrinks = [...drinks].sort((a, b) => a.time - b.time);
  for (const d of sortedDrinks) {
    const i = idxAt(d.time);
    const cx = x(curve[i][0]);
    const text = `${d.standardDrinks.toFixed(1)}×`;
    const w = text.length * 5.6 + 8;
    // Keep the label inside the plot; the leader still points at the dot.
    const tx = Math.min(Math.max(cx, PAD.left + w / 2), W - PAD.right - w / 2);
    const left = tx - w / 2;
    let row = rowEnd.findIndex((end) => left >= end);
    if (row === -1) row = rowEnd.indexOf(Math.min(...rowEnd));
    rowEnd[row] = tx + w / 2;
    labels.push({ cx, cy: y(curve[i][1]), tx, text, row, color: zoneFor(curve[i][1]).color });
  }

  const peak = curve[peakIdx];
  const peakX = x(peak[0]);
  const peakLabel = `Peak ${formatBac(peak[1])} · ${formatTime(peak[0])} · ${zoneFor(peak[1]).label}`;
  const peakAnchor: 'start' | 'middle' | 'end' =
    peakX < PAD.left + 70 ? 'start' : peakX > W - PAD.right - 70 ? 'end' : 'middle';

  const scrub = scrubIdx !== null ? curve[scrubIdx] : null;

  const scrubTo = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = Math.min(Math.max(clientX - rect.left, PAD.left), W - PAD.right);
    const t = x0 + ((px - PAD.left) / plotW) * (x1 - x0);
    const i = idxAt(t);
    setScrubIdx(i);
    onScrub({ time: curve[i][0], bac: curve[i][1] });
  };
  const endScrub = () => {
    setScrubIdx(null);
    onScrub(null);
  };

  return (
    <div ref={wrapRef} className="w-full select-none">
      {width > 0 && (
        <svg
          ref={svgRef}
          width={W}
          height={H}
          className="block touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubTo(e.clientX);
          }}
          onPointerMove={(e) => {
            if (scrubIdx !== null) scrubTo(e.clientX);
          }}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          role="img"
          aria-label="Estimated blood alcohol over time"
        >
          {/* Baseline + hour ticks */}
          <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} stroke={INK.grid} strokeWidth={1} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={baseline} y2={baseline + 4} stroke={INK.grid} strokeWidth={1} />
              <text
                x={x(t)}
                y={baseline + 16}
                textAnchor="middle"
                fontSize={10}
                fill={INK.muted}
                fontFamily={FONT}
              >
                {hourLabel(t)}
              </text>
            </g>
          ))}

          {/* Zone boundaries */}
          {thresholds.map((th) => (
            <g key={th}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(th)} y2={y(th)} stroke={INK.grid} strokeWidth={1} />
              <text x={W - PAD.right} y={y(th) - 3} textAnchor="end" fontSize={9} fill={INK.muted} fontFamily={FONT}>
                {th.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Area wash, colored by zone */}
          {segments.map((seg, i) => (
            <path key={i} d={areaOf(seg.pts)} fill={seg.color} fillOpacity={seg.future ? 0.07 : 0.14} />
          ))}

          {/* Curve: solid past, lighter projection, colored by zone */}
          {segments.map((seg, i) => (
            <path
              key={i}
              d={pathOf(seg.pts)}
              fill="none"
              stroke={seg.color}
              strokeOpacity={seg.future ? 0.5 : 1}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Now marker (sits on the baseline if every drink is still ahead) */}
          {scrub === null && now <= curve[curve.length - 1][0] && (
            <>
              <line x1={x(now)} x2={x(now)} y1={PAD.top} y2={baseline} stroke={INK.grid} strokeWidth={1} />
              <circle
                cx={x(now)}
                cy={nowIdx >= 0 ? y(curve[nowIdx][1]) : baseline}
                r={4}
                fill={INK.primary}
                stroke={SURFACE}
                strokeWidth={2}
              />
            </>
          )}

          {/* Leaders (under everything else) */}
          {labels.map((l, i) => (
            <line key={i} x1={l.cx} x2={l.cx} y1={DRINK_ROW_Y[l.row] + 4} y2={l.cy} stroke={INK.grid} strokeWidth={1} />
          ))}
          <line x1={peakX} x2={peakX} y1={PEAK_ROW_Y + 4} y2={y(peak[1])} stroke={INK.grid} strokeWidth={1} />

          {/* Drink markers + labels */}
          {labels.map((l, i) => (
            <g key={i}>
              <circle cx={l.cx} cy={l.cy} r={4} fill={l.color} stroke={SURFACE} strokeWidth={2} />
              <text
                x={l.tx}
                y={DRINK_ROW_Y[l.row]}
                textAnchor="middle"
                fontSize={10}
                fill={INK.secondary}
                stroke={SURFACE}
                strokeWidth={3}
                paintOrder="stroke"
                fontFamily={FONT}
              >
                {l.text}
              </text>
            </g>
          ))}

          {/* Peak annotation */}
          <g>
            <circle cx={peakX} cy={y(peak[1])} r={4} fill={zoneFor(peak[1]).color} stroke={SURFACE} strokeWidth={2} />
            <text
              x={peakX}
              y={PEAK_ROW_Y}
              textAnchor={peakAnchor}
              fontSize={11}
              fontWeight={500}
              fill={INK.primary}
              stroke={SURFACE}
              strokeWidth={3}
              paintOrder="stroke"
              fontFamily={FONT}
            >
              {peakLabel}
            </text>
          </g>

          {/* Scrub crosshair */}
          {scrub && (
            <>
              <line x1={x(scrub[0])} x2={x(scrub[0])} y1={PAD.top} y2={baseline} stroke={INK.secondary} strokeWidth={1} />
              <circle cx={x(scrub[0])} cy={y(scrub[1])} r={5} fill={INK.primary} stroke={SURFACE} strokeWidth={2} />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
