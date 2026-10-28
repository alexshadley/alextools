// Blood alcohol estimation using the Widmark model with a simple linear
// absorption ramp per drink and constant zero-order elimination.
//
// BAC (%) = (grams of alcohol absorbed / (r * body weight in grams)) * 100
//           - elimination rate * hours elapsed
//
// r is the Widmark distribution ratio (fraction of body mass that alcohol
// distributes into). The elimination rate is clamped so BAC never goes below 0.

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
/** Minutes over which a drink is assumed to be absorbed into the blood. */
export const ABSORPTION_MINUTES = 30;

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
): Array<[number, number]> {
  if (drinks.length === 0) return [];
  const sorted = [...drinks].sort((a, b) => a.time - b.time);
  const start = sorted[0].time;
  const absorptionMs = ABSORPTION_MINUTES * 60_000;
  const eliminationPerStep = (ELIMINATION_RATE_PER_HOUR * STEP_MS) / 3_600_000;

  const points: Array<[number, number]> = [];
  let bac = 0;
  for (let t = start; t <= until; t += STEP_MS) {
    // Absorb: each drink contributes its peak linearly over the absorption window.
    for (const d of sorted) {
      if (t < d.time) continue;
      const elapsed = t - d.time;
      if (elapsed < absorptionMs) {
        bac += (peakContribution(d, profile) * STEP_MS) / absorptionMs;
      } else if (elapsed < absorptionMs + STEP_MS) {
        // Final partial step so the total absorbed equals the peak exactly.
        const remainder = absorptionMs - (elapsed - STEP_MS);
        if (remainder > 0) bac += (peakContribution(d, profile) * remainder) / absorptionMs;
      }
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

export function estimate(drinks: Drink[], profile: Profile, now: number): Estimate {
  if (drinks.length === 0) {
    return { bac: 0, peak: 0, peakAt: null, legalAt: null, soberAt: null, rising: false };
  }
  // Project far enough ahead to find sobriety: 24h after the last drink.
  const lastDrink = Math.max(...drinks.map((d) => d.time));
  const horizon = Math.max(now, lastDrink) + 24 * 3_600_000;
  const curve = simulate(drinks, profile, horizon);

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
