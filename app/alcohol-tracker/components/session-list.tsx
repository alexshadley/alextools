'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { estimate, stageFor } from '../lib/bac';
import { createSession, useHydrated, useProfile, useSessions } from '../lib/storage';
import { ProfileForm } from './profile-form';
import { useNow } from './use-now';
import { StageBadge, buttonPrimary, formatBac } from './ui';

export function SessionList() {
  const hydrated = useHydrated();
  const sessions = useSessions();
  const profile = useProfile();
  const router = useRouter();
  const [now] = useNow();

  const start = () => {
    const s = createSession();
    router.push(`/alcohol-tracker/session/${s.id}`);
  };

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alcohol Tracker</h1>
        <p className="text-sm text-zinc-500">Log drinks, see where you&apos;re at.</p>
      </header>

      <button type="button" onClick={start} className={buttonPrimary}>
        + New session
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-500">Sessions</h2>
        {!hydrated ? null : sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No sessions yet. Start one above.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {sessions.map((s) => {
              const est = estimate(s.drinks, profile, now);
              const active = est.bac > 0;
              const total = s.drinks.reduce((sum, d) => sum + d.standardDrinks, 0);
              return (
                <li key={s.id}>
                  <Link
                    href={`/alcohol-tracker/session/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{s.name}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(s.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        · {s.drinks.length} drink{s.drinks.length === 1 ? '' : 's'} ·{' '}
                        {total.toFixed(1)} std · peak {formatBac(est.peak)}%
                      </span>
                    </div>
                    {active ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm tabular-nums">{formatBac(est.bac)}%</span>
                        <StageBadge stage={stageFor(est.bac)} />
                      </div>
                    ) : (
                      <span className="text-zinc-400">›</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ProfileForm />
    </>
  );
}
