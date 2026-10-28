'use client';

import { useState } from 'react';
import type { Profile, Sex } from '../lib/bac';
import { saveProfile, useProfile } from '../lib/storage';
import { buttonSecondary, inputClass } from './ui';

const LB_PER_KG = 2.20462;

export function ProfileForm() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium">Your profile</span>
        <span className="text-xs text-zinc-500">
          {Math.round(profile.weightKg * LB_PER_KG)} lb · {profile.sex}
          <span className="ml-2">{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {open && <ProfileFields profile={profile} onDone={() => setOpen(false)} />}
    </section>
  );
}

function ProfileFields({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState(() =>
    String(Math.round(unit === 'lb' ? profile.weightKg * LB_PER_KG : profile.weightKg)),
  );
  const [sex, setSex] = useState<Sex>(profile.sex);

  const switchUnit = (next: 'lb' | 'kg') => {
    if (next === unit) return;
    const n = parseFloat(weight);
    if (!isNaN(n)) {
      setWeight(String(Math.round(next === 'lb' ? n * LB_PER_KG : n / LB_PER_KG)));
    }
    setUnit(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(weight);
    if (isNaN(n) || n <= 0) return;
    saveProfile({ weightKg: unit === 'lb' ? n / LB_PER_KG : n, sex });
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4">
      <p className="text-xs text-zinc-500">
        Used in the Widmark formula. Sex selects the body-water ratio (0.68 for male, 0.55 for
        female); pick whichever better matches your body composition.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Weight
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-zinc-200">
            {(['lb', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => switchUnit(u)}
                className={`px-3 text-sm ${unit === u ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-600'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Sex
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-zinc-200">
          {(['male', 'female'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSex(s)}
              className={`flex-1 py-2 text-sm capitalize ${sex === s ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-600'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </label>
      <button type="submit" className={buttonSecondary}>
        Save
      </button>
    </form>
  );
}
