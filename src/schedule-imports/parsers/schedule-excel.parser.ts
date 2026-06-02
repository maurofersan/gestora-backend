import * as XLSX from 'xlsx';
import {
  SCHEDULE_IMPORT_COLUMNS,
  type ScheduleImportColumn,
} from '../schedule-import.constants';
import type {
  ScheduleImportParsedRow,
  ScheduleImportRowError,
  ScheduleImportRowInput,
} from '../types/schedule-import-row.types';
import {
  mapHeaders,
  missingRequiredColumns,
  normalizeImportHeader,
} from '../utils/schedule-import-header.util';
import { parseScheduleDate } from '../utils/schedule-import-date.util';

export interface ScheduleExcelParseResult {
  columnsFound: ScheduleImportColumn[];
  columnsMissing: ScheduleImportColumn[];
  unknownHeaders: string[];
  rows: ScheduleImportParsedRow[];
}

export function parseScheduleExcel(buffer: Buffer): ScheduleExcelParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      columnsFound: [],
      columnsMissing: [...SCHEDULE_IMPORT_COLUMNS],
      unknownHeaders: [],
      rows: [],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (matrix.length === 0) {
    return {
      columnsFound: [],
      columnsMissing: [...SCHEDULE_IMPORT_COLUMNS],
      unknownHeaders: [],
      rows: [],
    };
  }

  const headerRow = matrix[0] ?? [];
  const { columnMap, unknownHeaders } = mapHeaders(headerRow);
  const columnsMissing = missingRequiredColumns(columnMap);
  const columnsFound = SCHEDULE_IMPORT_COLUMNS.filter((c) => columnMap[c] !== undefined);

  const rows: ScheduleImportParsedRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const rowNumber = i + 1;
    const raw = buildRawRecord(headerRow, row);
    if (isEmptyDataRow(row, columnMap)) continue;

    const { input, errors } = parseDataRow(row, columnMap, rowNumber);
    rows.push({ rowNumber, raw, input, errors });
  }

  return { columnsFound, columnsMissing, unknownHeaders, rows };
}

function buildRawRecord(headerRow: unknown[], row: unknown[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  headerRow.forEach((header, index) => {
    const key = String(header ?? '').trim() || `col_${index}`;
    raw[key] = row[index] ?? '';
  });
  return raw;
}

function isEmptyDataRow(
  row: unknown[],
  columnMap: Partial<Record<ScheduleImportColumn, number>>,
): boolean {
  const codigoIdx = columnMap.codigo;
  const descIdx = columnMap.descripcion;
  const values = [
    codigoIdx !== undefined ? row[codigoIdx] : '',
    descIdx !== undefined ? row[descIdx] : '',
  ];
  return values.every((v) => String(v ?? '').trim() === '');
}

function cellValue(row: unknown[], index: number | undefined): unknown {
  if (index === undefined) return '';
  return row[index] ?? '';
}

function parseDataRow(
  row: unknown[],
  columnMap: Partial<Record<ScheduleImportColumn, number>>,
  rowNumber: number,
): { input: ScheduleImportRowInput | null; errors: ScheduleImportRowError[] } {
  const errors: ScheduleImportRowError[] = [];

  const codigo = String(cellValue(row, columnMap.codigo)).trim();
  const descripcion = String(cellValue(row, columnMap.descripcion)).trim();
  const partidaNombre = String(cellValue(row, columnMap.partida_nombre)).trim();
  const sectorNombre = String(cellValue(row, columnMap.sector_nombre)).trim();
  const especialidadNombre = String(cellValue(row, columnMap.especialidad_nombre)).trim();

  const fechaRaw = cellValue(row, columnMap.fecha_inicio);
  const duracionRaw = cellValue(row, columnMap.duracion_dias);

  if (!codigo) errors.push({ field: 'codigo', message: 'Código obligatorio' });
  if (!descripcion) errors.push({ field: 'descripcion', message: 'Descripción obligatoria' });
  if (!partidaNombre) {
    errors.push({ field: 'partida_nombre', message: 'Nombre de partida obligatorio' });
  }
  if (!sectorNombre) {
    errors.push({ field: 'sector_nombre', message: 'Sector obligatorio (columna requerida)' });
  }
  if (!especialidadNombre) {
    errors.push({ field: 'especialidad_nombre', message: 'Especialidad obligatoria' });
  }

  const fechaInicio = parseScheduleDate(fechaRaw);
  if (!fechaInicio) {
    errors.push({
      field: 'fecha_inicio',
      message: 'Fecha de inicio inválida (use YYYY-MM-DD o DD/MM/YYYY)',
    });
  }

  const duracionDias = parseDurationDays(duracionRaw);
  if (duracionDias === null) {
    errors.push({
      field: 'duracion_dias',
      message: 'Duración inválida (entero ≥ 1)',
    });
  }

  if (errors.length > 0 || !fechaInicio || duracionDias === null) {
    return { input: null, errors };
  }

  if (codigo.length > 64) {
    errors.push({ field: 'codigo', message: 'Código demasiado largo (máx. 64)' });
    return { input: null, errors };
  }

  return {
    input: {
      codigo,
      descripcion,
      partidaNombre,
      sectorNombre,
      especialidadNombre,
      fechaInicio,
      duracionDias,
    },
    errors: [],
  };
}

function parseDurationDays(value: unknown): number | null {
  const text = String(value ?? '')
    .trim()
    .replace(/d[ií]as?/gi, '')
    .trim();
  const num = Number(text);
  if (!Number.isFinite(num) || num < 1 || num > 366) return null;
  return Math.round(num);
}

/** Expone normalización para tests. */
export { normalizeImportHeader };
