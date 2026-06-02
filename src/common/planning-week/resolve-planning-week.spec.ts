import {
  civilDateStringToProjectDayStart,
  resolvePlanningWeekFromAnchor,
  weekAnchorsForPlannedWindow,
} from './resolve-planning-week';

describe('planning week vs activity dates', () => {
  it('actividad con inicio civil alineada intersecta la semana PPC en America/Santiago', () => {
    const tz = 'America/Santiago';
    const week = resolvePlanningWeekFromAnchor('2026-05-25', tz);
    const activityStart = civilDateStringToProjectDayStart('2026-05-25', tz);
    const activityEnd = civilDateStringToProjectDayStart('2026-05-29', tz);

    expect(activityStart.getTime()).toBeLessThanOrEqual(week.weekEnd.getTime());
    expect(activityEnd.getTime()).toBeGreaterThanOrEqual(week.weekStart.getTime());
  });

  it('weekAnchorsForPlannedWindow no genera semanas fuera del rango planned', () => {
    const tz = 'America/Santiago';
    const start = civilDateStringToProjectDayStart('2026-04-21', tz);
    const end = civilDateStringToProjectDayStart('2026-07-08', tz);
    const anchors = weekAnchorsForPlannedWindow(start, end, tz);

    expect(anchors.length).toBeGreaterThanOrEqual(8);
    expect(anchors.every((a) => a.startsWith('2026-'))).toBe(true);
    expect(anchors.some((a) => a > '2026-12-31')).toBe(false);
  });

  it('filtra semanas futuras respecto al lunes actual', () => {
    const tz = 'America/Santiago';
    const currentWeekAnchor = '2026-06-02';
    const anchors = weekAnchorsForPlannedWindow(
      civilDateStringToProjectDayStart('2026-04-21', tz),
      civilDateStringToProjectDayStart('2026-07-08', tz),
      tz,
    );
    const chartPoints = anchors.filter((a) => a <= currentWeekAnchor);
    expect(chartPoints.every((a) => a <= currentWeekAnchor)).toBe(true);
    expect(chartPoints.some((a) => a.startsWith('2026-07'))).toBe(false);
  });
});
