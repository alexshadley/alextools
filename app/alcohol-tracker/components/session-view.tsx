'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { estimate, stageFor, standardDrinks } from '../lib/bac';
import { deleteSession, removeDrink, updateSession, useHydrated, useProfile, useSession } from '../lib/storage';
import { BacChart, type ScrubPoint } from './bac-chart';
import { ProfileForm } from './profile-form';
import { StageBadge, buttonPrimary, buttonSecondary, formatBac, formatDuration, formatTime, inputClass } from './ui';
import { useNow } from './use-now';

export function SessionView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const session = useSession(id);
  const profile = useProfile();
  const router = useRouter();
  const [now, refreshNow] = useNow();
  const [renaming, setRenaming] = useState(false);
  const [scrub, setScrub] = useState<ScrubPoint | null>(null);

  const est = useMemo(
    () => (session ? estimate(session.drinks, profile, now) : null),
    [session, profile, now],
  );

  if (!hydrated) return null;
  if (!session || !est) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-zinc-400">Session not found.</p>
        <Link href="/alcohol-tracker" className="text-amber-400">
          ← Back to sessions
        </Link>
      </div>
    );
  }

  const shownBac = scrub ? scrub.bac : est.bac;
  const stage = stageFor(shownBac);
  const totalStd = session.drinks.reduce((sum, d) => sum + standardDrinks(d), 0);
  const drinks = [...session.drinks].sort((a, b) => b.time - a.time);

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href="/alcohol-tracker" className="text-sm text-zinc-400">
          ← Sessions
        </Link>
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get('name');
              if (typeof name === 'string' && name.trim()) updateSession(id, { name: name.trim() });
              setRenaming(false);
            }}
            className="flex gap-2"
          >
            <input name="name" defaultValue={session.name} autoFocus className={inputClass} />
            <button type="submit" className={buttonSecondary}>
              Save
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="text-left text-2xl font-semibold tracking-tight"
            title="Tap to rename"
          >
            {session.name}
          </button>
        )}
      </header>

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 pt-4">
        <div className="flex items-baseline justify-between px-4">
          <span className="text-sm text-zinc-400">
            {scrub ? `At ${formatTime(scrub.time)}` : 'Estimated BAC now'}
          </span>
          <StageBadge stage={stage} />
        </div>
        <div className="flex items-baseline gap-2 px-4">
          <span className="font-mono text-5xl font-semibold tabular-nums">{formatBac(shownBac)}</span>
          <span className="text-zinc-400">%</span>
          {!scrub && est.rising && <span className="text-sm text-amber-400">↑ rising</span>}
        </div>
        <p className="min-h-10 px-4 text-sm text-zinc-400">{stage.description}</p>
        <div className="px-2">
          <BacChart drinks={session.drinks} profile={profile} now={now} onScrub={setScrub} />
        </div>
      </section>

      <Link href={`/alcohol-tracker/session/${id}/add`} className={`${buttonPrimary} text-center`}>
        + Add drink
      </Link>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
        <dt className="text-zinc-400">Drinks</dt>
        <dd className="text-right tabular-nums">
          {session.drinks.length} · {totalStd.toFixed(1)} std
        </dd>
        <dt className="text-zinc-400">Peak</dt>
        <dd className="text-right font-mono tabular-nums">{formatBac(est.peak)}%</dd>
        {est.legalAt !== null && (
          <>
            <dt className="text-zinc-400">Under 0.08</dt>
            <dd className="text-right tabular-nums">
              {formatTime(est.legalAt)} · {formatDuration(est.legalAt - now)}
            </dd>
          </>
        )}
        {est.soberAt !== null && (
          <>
            <dt className="text-zinc-400">Sober</dt>
            <dd className="text-right tabular-nums">
              {formatTime(est.soberAt)} · {formatDuration(est.soberAt - now)}
            </dd>
          </>
        )}
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-400">Log</h2>
        {drinks.length === 0 ? (
          <p className="text-sm text-zinc-500">No drinks yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/50">
            {drinks.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{d.label}</span>
                  <span className="text-xs text-zinc-400">
                    {formatTime(d.time)} · {(d.volumeMl / 29.5735).toFixed(1)} oz ·{' '}
                    {(d.abv * 100).toFixed(1)}% · {standardDrinks(d).toFixed(1)} std
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeDrink(id, d.id);
                    refreshNow();
                  }}
                  className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                  aria-label={`Remove ${d.label}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProfileForm />

      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete "${session.name}"? This cannot be undone.`)) {
            deleteSession(id);
            router.push('/alcohol-tracker');
          }
        }}
        className="self-start text-sm text-zinc-500 hover:text-red-400"
      >
        Delete session
      </button>

      <p className="text-xs text-zinc-600">
        Estimates use the Widmark formula with a 30-minute absorption ramp and 0.015%/hr
        elimination. Real BAC varies widely with food, medication, and individual metabolism.
        Never use this to decide whether you can drive.
      </p>
    </>
  );
}
