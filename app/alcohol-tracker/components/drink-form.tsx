'use client';

import { useMemo, useState } from 'react';
import { estimate, zoneFor, zoneIndex, type Drink, type Profile } from '../lib/bac';
import { addDrink } from '../lib/storage';
import { ZoneBadge, buttonPrimary, buttonSecondary, formatBac, formatTime, inputClass } from './ui';

const STEP = 0.5;
const MIN = 0.5;
const MAX = 10;
const DEFAULT_STD = 1.5;
const SLOT_MS = 30 * 60_000;
const HOURS_BACK = 12;
const HOURS_AHEAD = 6;

/** Most recent clock time at or before `now` on a :00 / :30 boundary. */
function floorToSlot(now: number): number {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
  return d.getTime();
}

function spanLabel(ms: number): string {
  const mins = Math.round(Math.abs(ms) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const span = h === 0 ? `${m} min` : m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  return ms < 0 ? `in ${span}` : `${span} ago`;
}

type Props = {
  sessionId: string;
  drinks: Drink[];
  profile: Profile;
  onAdded?: () => void;
};

export function DrinkForm({ sessionId, drinks, profile, onAdded }: Props) {
  const [std, setStd] = useState(DEFAULT_STD);
  // 'now' or a slot timestamp as a string (select values are strings).
  const [when, setWhen] = useState<string>('now');

  // Capture `now` once per mount so the option list doesn't shift under the user.
  const [openedAt] = useState(() => Date.now());
  const { past, future } = useMemo(() => {
    const past: number[] = [];
    const future: number[] = [];
    const last = floorToSlot(openedAt);
    for (let t = last; t >= openedAt - HOURS_BACK * 3_600_000; t -= SLOT_MS) past.push(t);
    for (let t = last + SLOT_MS; t <= openedAt + HOURS_AHEAD * 3_600_000; t += SLOT_MS) future.push(t);
    return { past, future };
  }, [openedAt]);

  // Where the session would peak with this drink added, versus without it.
  const preview = useMemo(() => {
    const time = when === 'now' ? openedAt : Number(when);
    const candidate: Drink = { id: 'preview', standardDrinks: std, time };
    const withDrink = estimate([...drinks, candidate], profile, openedAt);
    const without = estimate(drinks, profile, openedAt);
    return {
      peak: withDrink.peak,
      peakAt: withDrink.peakAt,
      zone: zoneFor(withDrink.peak),
      currentZone: drinks.length > 0 ? zoneFor(without.peak) : null,
    };
  }, [drinks, profile, std, when, openedAt]);

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
          <optgroup label="Later">
            {future.map((t) => (
              <option key={t} value={String(t)}>
                {formatTime(t)} · {spanLabel(openedAt - t)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Earlier">
            {past.map((t) => (
              <option key={t} value={String(t)}>
                {formatTime(t)} · {spanLabel(openedAt - t)}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <div
        className="flex flex-col gap-1.5 rounded-lg border-l-4 bg-zinc-50 px-3 py-2.5"
        style={{ borderColor: preview.zone.color }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-zinc-700">You&apos;d peak in the</span>
          <ZoneBadge zone={preview.zone} />
        </div>
        <p className="text-xs text-zinc-500">
          <span className="font-mono tabular-nums">{formatBac(preview.peak)}%</span>
          {preview.peakAt !== null && <> at {formatTime(preview.peakAt)}</>}
          {preview.currentZone && zoneIndex(preview.zone) > zoneIndex(preview.currentZone) && (
            <> · up from the {preview.currentZone.label.toLowerCase()}</>
          )}
          {preview.currentZone && zoneIndex(preview.zone) === zoneIndex(preview.currentZone) && (
            <> · same zone as without it</>
          )}
        </p>
        <p className="text-xs text-zinc-500">{preview.zone.description}</p>
      </div>

      <button type="submit" className={buttonPrimary}>
        Add drink
      </button>
    </form>
  );
}
