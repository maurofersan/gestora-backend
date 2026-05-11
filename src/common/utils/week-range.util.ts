/** Devuelve lunes 00:00 y domingo 23:59:59.999 en fecha local del servidor (MVP). */
export function getWeekRangeMondaySunday(anchor: Date): {
  weekStart: Date;
  weekEnd: Date;
} {
  const d = new Date(anchor);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}
