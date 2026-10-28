'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { estimate, zoneFor } from '../lib/bac';
import { deleteSession, removeDrink, updateSession, useHydrated, useProfile, useSession } from '../lib/storage';
import { BacChart, type ScrubPoint } from './bac-chart';
import { ProfileForm } from './profile-form';
import { StomachForm } from './stomach-form';
import { ZoneBadge, buttonPrimary, buttonSecondary, formatBacParts, formatTime, inputClass } from './ui';
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
    () => (session ? estimate(session.drinks, profile, now, session.stomach) : null),
    [session, profile, now],
  );

  if (!hydrated) return null;
  if (!session || !est) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-zinc-500">Session not found.</p>
        <Link href="/alcohol-tracker" className="text-zinc-900 underline underline-offset-4">
          ← Back to sessions
        </Link>
      </div>
    );
  }

  const shownBac = scrub ? scrub.bac : est.bac;
  const zone = zoneFor(shownBac);
  const drinks = [...session.drinks].sort((a, b) => b.time - a.time);

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href="/alcohol-tracker" className="text-sm text-zinc-500">
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

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white pt-4">
        <div className="flex items-baseline justify-between px-4">
          <span className="text-sm text-zinc-500">
            {scrub ? `At ${formatTime(scrub.time)}` : 'Estimated BAC now'}
          </span>
          <ZoneBadge zone={zone} />
        </div>
        <div className="flex items-baseline gap-2 px-4">
          <span className="font-mono text-5xl font-semibold tabular-nums" style={{ color: zone.color }}>
            {formatBacParts(shownBac).main}
            <span className="opacity-40">{formatBacParts(shownBac).faint}</span>
          </span>
          {!scrub && est.rising && <span className="text-sm text-zinc-500">↑ rising</span>}
        </div>
        <div className="px-2">
          <BacChart drinks={session.drinks} profile={profile} stomach={session.stomach} now={now} onScrub={setScrub} />
        </div>
      </section>

      <Link href={`/alcohol-tracker/session/${id}/add`} className={`${buttonPrimary} text-center`}>
        + Add drink
      </Link>


      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-500">Log</h2>
        {drinks.length === 0 ? (
          <p className="text-sm text-zinc-500">No drinks yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {drinks.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>
                    {d.standardDrinks.toFixed(1)} standard drink{d.standardDrinks.toFixed(1) === '1.0' ? '' : 's'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatTime(d.time)}
                    {d.time > now && ' · planned'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeDrink(id, d.id);
                    refreshNow();
                  }}
                  className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
                  aria-label={`Remove drink at ${formatTime(d.time)}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StomachForm sessionId={id} value={session.stomach} />

      <ProfileForm />

      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete "${session.name}"? This cannot be undone.`)) {
            deleteSession(id);
            router.push('/alcohol-tracker');
          }
        }}
        className="self-start text-sm text-zinc-500 hover:text-red-600"
      >
        Delete session
      </button>

      <p className="text-xs text-zinc-400">
        Estimates use the Widmark formula with first-order absorption (rate set by stomach
        contents) and 0.015%/hr elimination. Real BAC varies widely with food, medication, and individual metabolism.
        Never use this to decide whether you can drive.
      </p>
    </>
  );
}
