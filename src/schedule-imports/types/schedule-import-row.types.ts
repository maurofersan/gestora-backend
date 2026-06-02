export interface ScheduleImportRowInput {
  codigo: string;
  descripcion: string;
  partidaNombre: string;
  sectorNombre: string;
  especialidadNombre: string;
  fechaInicio: Date;
  duracionDias: number;
}

export interface ScheduleImportRowError {
  field?: string;
  message: string;
}

export interface ScheduleImportParsedRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  input: ScheduleImportRowInput | null;
  errors: ScheduleImportRowError[];
}

export interface ScheduleImportRowResolution {
  sectorExists: boolean;
  workPackageExists: boolean;
  specialtyExists: boolean;
  activityExists: boolean;
  workPackageSpecialtyMismatch?: boolean;
}

export interface ScheduleImportPreviewRowData {
  codigo: string;
  descripcion: string;
  partidaNombre: string;
  sectorNombre: string;
  especialidadNombre: string;
  fechaInicio: string;
  duracionDias: number;
}

export interface ScheduleImportPreviewRow {
  rowNumber: number;
  valid: boolean;
  errors: ScheduleImportRowError[];
  data: ScheduleImportPreviewRowData | null;
  resolution: ScheduleImportRowResolution | null;
  action: 'create' | 'update' | 'skip' | null;
}

export interface ScheduleImportPreviewSummary {
  wouldCreateActivities: number;
  wouldUpdateActivities: number;
  wouldSkipActivities: number;
  wouldCreateSectors: number;
  wouldCreateWorkPackages: number;
  invalidRows: number;
}

export interface ScheduleImportPreviewResult {
  columnsFound: string[];
  columnsMissing: string[];
  totalRows: number;
  validRows: number;
  rows: ScheduleImportPreviewRow[];
  summary: ScheduleImportPreviewSummary;
}

export interface ScheduleImportStats {
  activitiesCreated: number;
  activitiesUpdated: number;
  activitiesSkipped: number;
  sectorsCreated: number;
  workPackagesCreated: number;
  errors: number;
}

export interface ScheduleImportErrorDetail {
  rowNumber: number;
  message: string;
}

export interface ScheduleImportPpcRegeneration {
  specialtiesProcessed: number;
  weeksUpserted: number;
  weeksRemoved: number;
}

export interface ScheduleImportResult {
  scheduleUploadId: string | null;
  stats: ScheduleImportStats;
  errors: ScheduleImportErrorDetail[];
  ppcRegeneration: ScheduleImportPpcRegeneration | null;
}
