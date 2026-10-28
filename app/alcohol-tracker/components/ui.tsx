'use client';

import type { Stage } from '../lib/bac';

export const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-base text-zinc-50 outline-none focus:border-amber-500';

export const buttonPrimary =
  'rounded-lg bg-amber-500 px-4 py-2.5 text-base font-medium text-zinc-950 transition-colors hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50';

export const buttonSecondary =
  'rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-base text-zinc-100 transition-colors hover:bg-zinc-800 active:bg-zinc-700';

const toneClasses: Record<Stage['tone'], string> = {
  zinc: 'bg-zinc-800 text-zinc-200',
  green: 'bg-emerald-900/60 text-emerald-300',
  yellow: 'bg-yellow-900/60 text-yellow-300',
  orange: 'bg-orange-900/60 text-orange-300',
  red: 'bg-red-900/60 text-red-300',
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[stage.tone]}`}
    >
      {stage.label}
    </span>
  );
}

export function formatBac(bac: number): string {
  return bac.toFixed(3);
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** Local datetime string for <input type="datetime-local">. */
export function toLocalInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
