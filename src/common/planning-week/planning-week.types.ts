/** Rango de semana de planificación (lunes–domingo) en zona IANA del proyecto. */
export type PlanningWeekBounds = {
  /** Lunes normalizado en calendario de la zona (YYYY-MM-DD). */
  weekStartMonday: string;
  /** Instante UTC del inicio del lunes 00:00 en la zona. */
  weekStart: Date;
  /** Instante UTC del fin del domingo 23:59:59.999 en la zona. */
  weekEnd: Date;
  weekLabel: string;
};

export type PlanningWeekResolution = PlanningWeekBounds & {
  projectTimeZone: string;
};
