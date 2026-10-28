'use client';

import type { Stage } from '../lib/bac';

export const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-amber-500';

export const buttonPrimary =
  'rounded-lg bg-amber-500 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50';

export const buttonSecondary =
  'rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base text-zinc-900 transition-colors hover:bg-zinc-100 active:bg-zinc-200';

const toneClasses: Record<Stage['tone'], string> = {
  zinc: 'bg-zinc-100 text-zinc-700',
  green: 'bg-emerald-100 text-emerald-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
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
