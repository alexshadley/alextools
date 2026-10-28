// Blood alcohol estimation: a one-compartment model with first-order
// absorption and zero-order (Widmark) elimination.
//
// Each drink's alcohol moves from gut to blood at a rate proportional to what
// is still in the gut, so the fraction absorbed after t hours is
//   1 - e^(-k_a * t)
// where k_a depends on stomach contents (food slows gastric emptying). Once in
// the blood it is eliminated at a constant rate.
//
// Peak contribution of a drink = (grams of alcohol / (r * body weight in grams)) * 100
// where r is the Widmark distribution ratio. BAC is clamped at 0.

export type Sex = 'male' | 'female';

export type Profile = {
  weightKg: number;
  sex: Sex;
};

export type Drink = {
  id: string;
  /** Size in US standard drinks (14 g of ethanol each) */
  standardDrinks: number;
  /** Unix ms when the drink was started */
  time: number;
};

export const ETHANOL_DENSITY_G_PER_ML = 0.789;
/** Grams of ethanol in one US standard drink. */
export const STANDARD_DRINK_GRAMS = 14;
/** %BAC eliminated per hour (population average). */
export const ELIMINATION_RATE_PER_HOUR = 0.015;
export type Stomach = 'empty' | 'light' | 'full';

export const DEFAULT_STOMACH: Stomach = 'light';

/**
 * First-order absorption rate constant k_a, per hour, by stomach contents.
 * Chosen so a single standard drink for a 75 kg male peaks near .019 (empty),
 * .014 (light meal), and .010 (full meal), in line with fed/fasting studies.
 */
export const ABSORPTION_RATE_PER_HOUR: Record<Stomach, number> = {
  empty: 6,
  light: 3,
  full: 2,
};

export const STOMACH_OPTIONS: Array<{ key: Stomach; label: string; hint: string }> = [
  { key: 'empty', label: 'Empty', hint: 'Nothing to eat for a few hours' },
  { key: 'light', label: 'Light meal', hint: 'A snack or small meal' },
  { key: 'full', label: 'Full meal', hint: 'A proper meal with the drinks' },
];

const WIDMARK_R: Record<Sex, number> = { male: 0.68, female: 0.55 };

export function alcoholGrams(drink: Pick<Drink, 'standardDrinks'>): number {
  return drink.standardDrinks * STANDARD_DRINK_GRAMS;
}

/** Standard drinks in a volume/ABV pour, used to migrate older stored drinks. */
export function standardDrinksFromPour(volumeMl: number, abv: number): number {
  return (volumeMl * abv * ETHANOL_DENSITY_G_PER_ML) / STANDARD_DRINK_GRAMS;
}

/** Peak %BAC contribution of a drink once fully absorbed. */
function peakContribution(drink: Drink, profile: Profile): number {
  const bodyGrams = profile.weightKg * 1000;
  return (alcoholGrams(drink) / (WIDMARK_R[profile.sex] * bodyGrams)) * 100;
}

const STEP_MS = 60_000;

/**
 * Simulate %BAC minute-by-minute from the first drink until `until`.
 * Returns the curve as [timeMs, bac] pairs (one per minute).
 */
export function simulate(
  drinks: Drink[],
  profile: Profile,
  until: number,
  stomach: Stomach = DEFAULT_STOMACH,
): Array<[number, number]> {
  if (drinks.length === 0) return [];
  const sorted = [...drinks].sort((a, b) => a.time - b.time);
  const start = sorted[0].time;
  const ka = ABSORPTION_RATE_PER_HOUR[stomach];
  const stepH = STEP_MS / 3_600_000;
  const eliminationPerStep = ELIMINATION_RATE_PER_HOUR * stepH;
  const peaks = sorted.map((d) => peakContribution(d, profile));

  const points: Array<[number, number]> = [];
  let bac = 0;
  for (let t = start; t <= until; t += STEP_MS) {
    // Absorb: the fraction of each drink that moved into the blood during this
    // step is the difference of 1 - e^(-ka*t) at the step's ends.
    for (let i = 0; i < sorted.length; i++) {
      const d = sorted[i];
      if (t < d.time) continue;
      const hoursNow = (t - d.time) / 3_600_000;
      const hoursBefore = Math.max(0, hoursNow - stepH);
      bac += peaks[i] * (Math.exp(-ka * hoursBefore) - Math.exp(-ka * hoursNow));
    }
    bac = Math.max(0, bac - eliminationPerStep);
    points.push([t, bac]);
  }
  return points;
}

export type Estimate = {
  /** Current %BAC */
  bac: number;
  /** Peak %BAC reached so far or projected (whichever is higher) */
  peak: number;
  /** Unix ms of the peak, or null with no drinks */
  peakAt: number | null;
  /** Unix ms when BAC is projected to drop below 0.08, or null if already below */
  legalAt: number | null;
  /** Unix ms when BAC is projected to reach 0, or null if already 0 */
  soberAt: number | null;
  /** True if BAC is still climbing (drinks not yet fully absorbed) */
  rising: boolean;
};

export function estimate(
  drinks: Drink[],
  profile: Profile,
  now: number,
  stomach: Stomach = DEFAULT_STOMACH,
): Estimate {
  if (drinks.length === 0) {
    return { bac: 0, peak: 0, peakAt: null, legalAt: null, soberAt: null, rising: false };
  }
  // Project far enough ahead to find sobriety: 24h after the last drink.
  const lastDrink = Math.max(...drinks.map((d) => d.time));
  const horizon = Math.max(now, lastDrink) + 24 * 3_600_000;
  const curve = simulate(drinks, profile, horizon, stomach);

  let bac = 0;
  let peak = 0;
  let peakAt: number | null = null;
  let legalAt: number | null = null;
  let soberAt: number | null = null;
  let nowIdx = -1;
  for (let i = 0; i < curve.length; i++) {
    const [t, v] = curve[i];
    if (v > peak) {
      peak = v;
      peakAt = t;
    }
    if (t <= now) {
      bac = v;
      nowIdx = i;
    }
  }
  if (nowIdx === -1) {
    // All drinks are in the future.
    return { bac: 0, peak, peakAt, legalAt: null, soberAt: null, rising: false };
  }
  const rising = nowIdx + 1 < curve.length && curve[nowIdx + 1][1] > bac;

  if (bac >= 0.08) {
    for (let i = nowIdx; i < curve.length; i++) {
      if (curve[i][1] < 0.08) {
        legalAt = curve[i][0];
        break;
      }
    }
  }
  if (bac > 0) {
    for (let i = nowIdx; i < curve.length; i++) {
      if (curve[i][1] <= 0) {
        soberAt = curve[i][0];
        break;
      }
    }
  }
  return { bac, peak, peakAt, legalAt, soberAt, rising };
}

export type ZoneKey = 'green' | 'yellow' | 'red' | 'purple';

export type Zone = {
  key: ZoneKey;
  label: string;
  description: string;
  /** Lower bound (inclusive) in %BAC */
  min: number;
  /** Chart mark color on a light surface */
  color: string;
};

/** Inebriation zones, ordered by rising BAC. */
export const ZONES: Zone[] = [
  { key: 'green', label: 'Green zone', description: 'Little to no impairment.', min: 0, color: '#16a34a' },
  {
    key: 'yellow',
    label: 'Yellow zone',
    description: 'Buzzed to tipsy. Judgment and coordination are impaired. Do not drive.',
    min: 0.05,
    color: '#ca8a04',
  },
  {
    key: 'red',
    label: 'Red zone',
    description: 'Drunk. Clear impairment of balance, speech, and judgment.',
    min: 0.1,
    color: '#dc2626',
  },
  {
    key: 'purple',
    label: 'Purple zone',
    description: 'Very drunk. Risk of blackout and alcohol poisoning.',
    min: 0.15,
    color: '#9333ea',
  },
];

/** Zone boundaries above zero, in ascending order. */
export const ZONE_THRESHOLDS = ZONES.slice(1).map((z) => z.min);

export function zoneFor(bac: number): Zone {
  let zone = ZONES[0];
  for (const z of ZONES) if (bac >= z.min) zone = z;
  return zone;
}

export function zoneIndex(zone: Zone): number {
  return ZONES.indexOf(zone);
}
