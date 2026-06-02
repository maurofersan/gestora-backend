import {
  SCHEDULE_IMPORT_COLUMNS,
  SCHEDULE_IMPORT_HEADER_ALIASES,
  type ScheduleImportColumn,
} from '../schedule-import.constants';

export function normalizeImportHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function mapHeaders(
  headerRow: unknown[],
): { columnMap: Partial<Record<ScheduleImportColumn, number>>; unknownHeaders: string[] } {
  const columnMap: Partial<Record<ScheduleImportColumn, number>> = {};
  const unknownHeaders: string[] = [];

  headerRow.forEach((cell, index) => {
    const normalized = normalizeImportHeader(cell);
    if (!normalized) return;

    const canonical = SCHEDULE_IMPORT_HEADER_ALIASES[normalized];
    if (canonical) {
      if (columnMap[canonical] === undefined) {
        columnMap[canonical] = index;
      }
      return;
    }
    unknownHeaders.push(String(cell).trim());
  });

  return { columnMap, unknownHeaders };
}

export function missingRequiredColumns(
  columnMap: Partial<Record<ScheduleImportColumn, number>>,
): ScheduleImportColumn[] {
  return SCHEDULE_IMPORT_COLUMNS.filter((col) => columnMap[col] === undefined);
}
