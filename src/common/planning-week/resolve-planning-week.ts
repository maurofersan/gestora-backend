import { DateTime } from 'luxon';
import type { PlanningWeekBounds } from './planning-week.types';

/** Ancla de semana: fecha civil `YYYY-MM-DD` (no instante UTC con hora). */
export const WEEK_ANCHOR_ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidWeekAnchorString(value: string): boolean {
  return WEEK_ANCHOR_ISO_DATE_PATTERN.test(value);
}

/** Convierte YYYY-MM-DD civil en la zona del proyecto al instante UTC de inicio de ese día local. */
export function civilDateStringToProjectDayStart(
  isoDate: string,
  ianaTimeZone: string,
): Date {
  const zone = normalizeProjectTimeZone(ianaTimeZone);
  return DateTime.fromISO(isoDate, { zone }).startOf('day').toJSDate();
}

/** Suma días calendario en la zona del proyecto (misma semántica que planned.durationDays). */
export function addCalendarDaysInProjectZone(
  start: Date,
  days: number,
  ianaTimeZone: string,
): Date {
  const zone = normalizeProjectTimeZone(ianaTimeZone);
  return DateTime.fromJSDate(start, { zone }).plus({ days }).toJSDate();
}

/** Valida IANA; si no es reconocida por Luxon, cae a UTC. */
export function normalizeProjectTimeZone(raw: string | undefined | null): string {
  const z = (raw ?? 'UTC').trim() || 'UTC';
  const probe = DateTime.now().setZone(z);
  return probe.isValid ? z : 'UTC';
}

/** Lunes de la semana (calendario local del proyecto) que contiene el instante dado. */
export function mondayOfInstantInProjectZone(instant: Date, ianaTimeZone: string): DateTime {
  const zone = normalizeProjectTimeZone(ianaTimeZone);
  const dt = DateTime.fromJSDate(instant, { zone }).startOf('day');
  const daysSinceMonday = (dt.weekday + 6) % 7;
  return dt.minus({ days: daysSinceMonday }).startOf('day');
}

/**
 * Fecha civil YYYY-MM-DD desde un Date guardado como medianoche UTC (parser Excel / legacy).
 */
export function civilIsoDateFromUtcMidnight(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** planned.end = inicio civil + durationDays (misma regla que create activity). */
export function plannedEndFromStartAndDuration(
  start: Date,
  durationDays: number,
  ianaTimeZone: string,
): Date {
  return addCalendarDaysInProjectZone(start, durationDays, ianaTimeZone);
}

/**
 * Lunes (YYYY-MM-DD) de cada semana de planificación que intersecta [planned.start, planned.end].
 */
export function weekAnchorsForPlannedWindow(
  plannedStart: Date,
  plannedEnd: Date,
  ianaTimeZone: string,
): string[] {
  const zone = normalizeProjectTimeZone(ianaTimeZone);
  let monday = mondayOfInstantInProjectZone(plannedStart, zone);
  const lastMonday = mondayOfInstantInProjectZone(plannedEnd, zone);
  const anchors: string[] = [];
  while (monday.toMillis() <= lastMonday.toMillis()) {
    anchors.push(monday.toISODate()!);
    monday = monday.plus({ weeks: 1 });
  }
  return anchors;
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
