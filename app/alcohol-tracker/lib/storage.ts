'use client';

// All data lives in localStorage so the app works fully offline as a PWA.
// A tiny pub/sub lets every mounted component re-render on any write.

import { useSyncExternalStore } from 'react';
import type { Drink, Profile } from './bac';

export type Session = {
  id: string;
  name: string;
  createdAt: number;
  drinks: Drink[];
};

const SESSIONS_KEY = 'alcohol-tracker:sessions';
const PROFILE_KEY = 'alcohol-tracker:profile';

export const DEFAULT_PROFILE: Profile = { weightKg: 75, sex: 'male' };

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSIONS_KEY || e.key === PROFILE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

// useSyncExternalStore needs referentially stable snapshots, so cache the
// parsed value keyed on the raw string.
const EMPTY_SESSIONS: Session[] = [];
let sessionsRaw: string | null = null;
let sessionsCache: Session[] = EMPTY_SESSIONS;
function readSessions(): Session[] {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (raw !== sessionsRaw) {
    sessionsRaw = raw;
    try {
      sessionsCache = raw ? (JSON.parse(raw) as Session[]) : EMPTY_SESSIONS;
    } catch {
      sessionsCache = EMPTY_SESSIONS;
    }
  }
  return sessionsCache;
}

let profileRaw: string | null = null;
let profileCache: Profile = DEFAULT_PROFILE;
function readProfile(): Profile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw !== profileRaw) {
    profileRaw = raw;
    try {
      profileCache = raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) } : DEFAULT_PROFILE;
    } catch {
      profileCache = DEFAULT_PROFILE;
    }
  }
  return profileCache;
}

function writeSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  emit();
}

export function useSessions(): Session[] {
  return useSyncExternalStore(subscribe, readSessions, () => EMPTY_SESSIONS);
}

export function useSession(id: string): Session | undefined {
  return useSessions().find((s) => s.id === id);
}

export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, readProfile, () => DEFAULT_PROFILE);
}

/** True once we're on the client and localStorage has been read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  emit();
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createSession(name?: string): Session {
  const now = Date.now();
  const session: Session = {
    id: newId(),
    name: name?.trim() || defaultSessionName(now),
    createdAt: now,
    drinks: [],
  };
  writeSessions([session, ...readSessions()]);
  return session;
}

export function defaultSessionName(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function updateSession(id: string, patch: Partial<Omit<Session, 'id'>>) {
  writeSessions(readSessions().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function deleteSession(id: string) {
  writeSessions(readSessions().filter((s) => s.id !== id));
}

export function addDrink(sessionId: string, drink: Omit<Drink, 'id'>) {
  const s = readSessions().find((x) => x.id === sessionId);
  if (!s) return;
  updateSession(sessionId, { drinks: [...s.drinks, { ...drink, id: newId() }] });
}

export function removeDrink(sessionId: string, drinkId: string) {
  const s = readSessions().find((x) => x.id === sessionId);
  if (!s) return;
  updateSession(sessionId, { drinks: s.drinks.filter((d) => d.id !== drinkId) });
}
