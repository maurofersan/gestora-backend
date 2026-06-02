/** Encabezados canónicos de la plantilla (fila 1 del Excel). */
export const SCHEDULE_IMPORT_COLUMNS = [
  'codigo',
  'descripcion',
  'partida_nombre',
  'sector_nombre',
  'especialidad_nombre',
  'fecha_inicio',
  'duracion_dias',
] as const;

export type ScheduleImportColumn = (typeof SCHEDULE_IMPORT_COLUMNS)[number];

/** Alias aceptados (sin acentos, minúsculas) → columna canónica. */
export const SCHEDULE_IMPORT_HEADER_ALIASES: Record<string, ScheduleImportColumn> = {
  codigo: 'codigo',
  codigo_actividad: 'codigo',
  code: 'codigo',
  id: 'codigo',

  descripcion: 'descripcion',
  descripcion_actividad: 'descripcion',
  nombre: 'descripcion',
  nombre_tarea: 'descripcion',
  subpartida: 'descripcion',
  actividad: 'descripcion',

  partida_nombre: 'partida_nombre',
  partida: 'partida_nombre',
  nombre_partida: 'partida_nombre',
  work_package: 'partida_nombre',

  sector_nombre: 'sector_nombre',
  sector: 'sector_nombre',

  especialidad_nombre: 'especialidad_nombre',
  especialidad: 'especialidad_nombre',
  specialty: 'especialidad_nombre',

  fecha_inicio: 'fecha_inicio',
  comienzo: 'fecha_inicio',
  inicio: 'fecha_inicio',
  planned_start: 'fecha_inicio',
  fecha_comienzo: 'fecha_inicio',

  duracion_dias: 'duracion_dias',
  duracion: 'duracion_dias',
  duration: 'duracion_dias',
  duracion_dia: 'duracion_dias',
  dias: 'duracion_dias',
};

export const SCHEDULE_IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const SCHEDULE_IMPORT_ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

export const SCHEDULE_IMPORT_ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls']);
