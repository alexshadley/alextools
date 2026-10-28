'use client';

import { STOMACH_OPTIONS, type Stomach } from '../lib/bac';
import { updateSession } from '../lib/storage';

export function StomachForm({ sessionId, value }: { sessionId: string; value: Stomach }) {
  const current = STOMACH_OPTIONS.find((o) => o.key === value) ?? STOMACH_OPTIONS[1];
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Stomach</span>
        <span className="text-xs text-zinc-500">{current.hint}</span>
      </div>
      <div className="flex overflow-hidden rounded-lg border border-zinc-200">
        {STOMACH_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => updateSession(sessionId, { stomach: o.key })}
            className={`flex-1 py-2 text-sm ${
              o.key === value ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        Food slows absorption, so the same drinks peak later and lower.
      </p>
    </section>
  );
}
