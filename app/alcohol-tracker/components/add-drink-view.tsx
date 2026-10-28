'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHydrated, useSession } from '../lib/storage';
import { DrinkForm } from './drink-form';

export function AddDrinkView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const session = useSession(id);
  const router = useRouter();
  const back = `/alcohol-tracker/session/${id}`;

  if (!hydrated) return null;
  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-zinc-400">Session not found.</p>
        <Link href="/alcohol-tracker" className="text-amber-400">
          ← Back to sessions
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href={back} className="text-sm text-zinc-400">
          ← {session.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add a drink</h1>
      </header>
      <DrinkForm sessionId={id} onAdded={() => router.push(back)} />
    </>
  );
}
