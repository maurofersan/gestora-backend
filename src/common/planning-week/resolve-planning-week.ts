import { DateTime } from 'luxon';
import type { PlanningWeekBounds } from './planning-week.types';

/** Ancla de semana: fecha civil `YYYY-MM-DD` (no instante UTC con hora). */
export const WEEK_ANCHOR_ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidWeekAnchorString(value: string): boolean {
  return WEEK_ANCHOR_ISO_DATE_PATTERN.test(value);
}

/** Valida IANA; si no es reconocida por Luxon, cae a UTC. */
export function normalizeProjectTimeZone(raw: string | undefined | null): string {
  const z = (raw ?? 'UTC').trim() || 'UTC';
  const probe = DateTime.now().setZone(z);
  return probe.isValid ? z : 'UTC';
}

/**
 * Interpreta `weekAnchor` como fecha civil YYYY-MM-DD en `ianaTimeZone` (no medianoche UTC).
 * Normaliza al lunes de esa semana ISO (lunes=primer día) en ese mismo calendario local.
 */
export function resolvePlanningWeekFromAnchor(
  weekAnchor: string,
  ianaTimeZone: string,
): PlanningWeekBounds {
  if (!isValidWeekAnchorString(weekAnchor)) {
    throw new Error('INVALID_WEEK_ANCHOR_FORMAT');
  }
  const zone = normalizeProjectTimeZone(ianaTimeZone);
  let dt = DateTime.fromISO(weekAnchor, { zone });
  if (!dt.isValid) {
    throw new Error('INVALID_WEEK_ANCHOR_DATE');
  }
  dt = dt.startOf('day');
  const daysSinceMonday = (dt.weekday + 6) % 7;
  const monday = dt.minus({ days: daysSinceMonday }).startOf('day');
  const sunday = monday.plus({ days: 6 }).endOf('day');
  const weekLabel = `${monday.toISODate()} — ${sunday.toISODate()}`;
  return {
    weekStartMonday: monday.toISODate()!,
    weekStart: monday.toJSDate(),
    weekEnd: sunday.toJSDate(),
    weekLabel,
  };
}
