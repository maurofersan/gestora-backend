import { DateTime } from 'luxon';
import {
  civilDateStringToProjectDayStart,
  resolvePlanningWeekFromAnchor,
} from './resolve-planning-week';

describe('planning week vs activity dates', () => {
  it('actividad con inicio civil alineada intersecta la semana PPC en America/Santiago', () => {
    const tz = 'America/Santiago';
    const week = resolvePlanningWeekFromAnchor('2026-05-25', tz);
    const activityStart = civilDateStringToProjectDayStart('2026-05-25', tz);
    const activityEnd = DateTime.fromJSDate(activityStart, { zone: tz })
      .plus({ days: 4 })
      .toJSDate();

    expect(activityStart.getTime()).toBeLessThanOrEqual(week.weekEnd.getTime());
    expect(activityEnd.getTime()).toBeGreaterThanOrEqual(week.weekStart.getTime());
  });
});
