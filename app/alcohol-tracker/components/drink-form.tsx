'use client';

import { useState } from 'react';
import { standardDrinks } from '../lib/bac';
import { addDrink } from '../lib/storage';
import { buttonPrimary, inputClass, toLocalInput } from './ui';

type Preset = { label: string; volumeMl: number; abv: number };

const OZ_ML = 29.5735;
const PRESETS: Preset[] = [
  { label: 'Beer', volumeMl: 12 * OZ_ML, abv: 0.05 },
  { label: 'IPA', volumeMl: 16 * OZ_ML, abv: 0.065 },
  { label: 'Wine', volumeMl: 5 * OZ_ML, abv: 0.12 },
  { label: 'Shot', volumeMl: 1.5 * OZ_ML, abv: 0.4 },
  { label: 'Cocktail', volumeMl: 1.5 * OZ_ML, abv: 0.4 },
  { label: 'Seltzer', volumeMl: 12 * OZ_ML, abv: 0.05 },
];

export function DrinkForm({ sessionId, onAdded }: { sessionId: string; onAdded?: () => void }) {
  const [preset, setPreset] = useState<Preset | null>(PRESETS[0]);
  const [label, setLabel] = useState(PRESETS[0].label);
  const [volumeOz, setVolumeOz] = useState(String(12));
  const [abvPct, setAbvPct] = useState(String(5));
  const [time, setTime] = useState(() => toLocalInput(Date.now()));
  const [editTime, setEditTime] = useState(false);

  const choose = (p: Preset) => {
    setPreset(p);
    setLabel(p.label);
    setVolumeOz(String(Math.round((p.volumeMl / OZ_ML) * 10) / 10));
    setAbvPct(String(p.abv * 100));
  };

  const volumeMl = parseFloat(volumeOz) * OZ_ML;
  const abv = parseFloat(abvPct) / 100;
  const valid = volumeMl > 0 && abv > 0 && abv <= 1 && label.trim().length > 0;
  const std = valid ? standardDrinks({ volumeMl, abv }) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const ts = editTime ? new Date(time).getTime() : Date.now();
    addDrink(sessionId, { label: label.trim(), volumeMl, abv, time: ts });
    setTime(toLocalInput(Date.now()));
    setEditTime(false);
    onAdded?.();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium">Add a drink</h2>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => choose(p)}
            className={`rounded-lg border px-2 py-2 text-sm ${
              preset?.label === p.label
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setPreset(null);
          }}
          placeholder="Name"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-1 text-sm text-zinc-400">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            value={volumeOz}
            onChange={(e) => {
              setVolumeOz(e.target.value);
              setPreset(null);
            }}
            className={inputClass}
          />
          oz
        </label>
        <label className="flex items-center gap-1 text-sm text-zinc-400">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={100}
            value={abvPct}
            onChange={(e) => {
              setAbvPct(e.target.value);
              setPreset(null);
            }}
            className={inputClass}
          />
          %
        </label>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        {editTime ? (
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTime(toLocalInput(Date.now()));
              setEditTime(true);
            }}
            className="text-zinc-400 underline decoration-dotted underline-offset-4"
          >
            Time: now (tap to change)
          </button>
        )}
      </div>
      <button type="submit" disabled={!valid} className={buttonPrimary}>
        Add {valid ? `· ${std.toFixed(1)} std drink${std >= 1.05 || std < 0.95 ? 's' : ''}` : ''}
      </button>
    </form>
  );
}
