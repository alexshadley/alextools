'use client';

import type { Zone, ZoneKey } from '../lib/bac';

export const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900';

export const buttonPrimary =
  'rounded-lg bg-zinc-950 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-50';

export const buttonSecondary =
  'rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base text-zinc-900 transition-colors hover:bg-zinc-100 active:bg-zinc-200';

const zoneClasses: Record<ZoneKey, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function ZoneBadge({ zone }: { zone: Zone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${zoneClasses[zone.key]}`}
    >
      <span className="size-2 rounded-full" style={{ background: zone.color }} aria-hidden />
      {zone.label}
    </span>
  );
}

/** Compact BAC: no leading zero, two decimals, no unit — e.g. ".08". */
export function formatBac(bac: number): string {
  return bac.toFixed(2).replace(/^0/, '');
}

/** Same as formatBac but with the third decimal split out for de-emphasis. */
export function formatBacParts(bac: number): { main: string; faint: string } {
  const s = bac.toFixed(3).replace(/^0/, '');
  return { main: s.slice(0, -1), faint: s.slice(-1) };
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
