'use client';

import { useMemo, useState } from 'react';
import { addDrink } from '../lib/storage';
import { buttonPrimary, buttonSecondary, formatTime, inputClass } from './ui';

const STEP = 0.5;
const MIN = 0.5;
const MAX = 10;
const DEFAULT_STD = 1.5;
const SLOT_MS = 30 * 60_000;
const HOURS_BACK = 12;

/** Most recent clock time at or before `now` on a :00 / :30 boundary. */
function floorToSlot(now: number): number {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
  return d.getTime();
}

function agoLabel(ms: number): string {
  const mins = Math.round(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min ago`;
  if (m === 0) return `${h} hr ago`;
  return `${h} hr ${m} min ago`;
}

export function DrinkForm({ sessionId, onAdded }: { sessionId: string; onAdded?: () => void }) {
  const [std, setStd] = useState(DEFAULT_STD);
  // 'now' or a slot timestamp as a string (select values are strings).
  const [when, setWhen] = useState<string>('now');

  // Capture `now` once per mount so the option list doesn't shift under the user.
  const [openedAt] = useState(() => Date.now());
  const slots = useMemo(() => {
    const out: number[] = [];
    const first = floorToSlot(openedAt);
    for (let t = first; t >= openedAt - HOURS_BACK * 3_600_000; t -= SLOT_MS) out.push(t);
    return out;
  }, [openedAt]);

  const bump = (delta: number) =>
    setStd((v) => Math.min(MAX, Math.max(MIN, Math.round((v + delta) / STEP) * STEP)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const time = when === 'now' ? Date.now() : Number(when);
    addDrink(sessionId, { standardDrinks: std, time });
    onAdded?.();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-500">Size</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => bump(-STEP)}
            disabled={std <= MIN}
            className={`${buttonSecondary} w-14 text-xl leading-none`}
            aria-label="Decrease"
          >
            −
          </button>
          <div className="flex flex-1 flex-col items-center">
            <span className="font-mono text-4xl font-semibold tabular-nums">{std.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">standard drink{std.toFixed(1) === '1.0' ? '' : 's'}</span>
          </div>
          <button
            type="button"
            onClick={() => bump(STEP)}
            disabled={std >= MAX}
            className={`${buttonSecondary} w-14 text-xl leading-none`}
            aria-label="Increase"
          >
            +
          </button>
        </div>
        <p className="text-xs text-zinc-400">
          1 standard drink ≈ 12 oz beer, 5 oz wine, or a 1.5 oz shot.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-zinc-500">Time</span>
        <select value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass}>
          <option value="now">Now</option>
          {slots.map((t) => (
            <option key={t} value={String(t)}>
              {formatTime(t)} · {agoLabel(openedAt - t)}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className={buttonPrimary}>
        Add drink
      </button>
    </form>
  );
}
