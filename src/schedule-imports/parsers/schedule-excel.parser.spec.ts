import * as XLSX from 'xlsx';
import { parseScheduleExcel } from './schedule-excel.parser';

describe('parseScheduleExcel', () => {
  function buildBuffer(rows: unknown[][]): Buffer {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Cronograma');
    return Buffer.from(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
  }

  it('parses filas válidas con encabezados canónicos', () => {
    const buffer = buildBuffer([
      [
        'codigo',
        'descripcion',
        'partida_nombre',
        'sector_nombre',
        'especialidad_nombre',
        'fecha_inicio',
        'duracion_dias',
      ],
      [
        'INF-001',
        'CARTEL DE OBRA DE 3.60 X 2.40M.',
        'OBRAS PROVISIONALES',
        'ZONA GENERAL',
        'Obras Civiles',
        '2026-04-21',
        1,
      ],
    ]);

    const result = parseScheduleExcel(buffer);
    expect(result.columnsMissing).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].errors).toHaveLength(0);
    expect(result.rows[0].input?.codigo).toBe('INF-001');
    expect(result.rows[0].input?.duracionDias).toBe(1);
  });

  it('acepta alias de columnas y fecha DD/MM/YYYY', () => {
    const buffer = buildBuffer([
      [
        'Código',
        'Nombre',
        'Partida',
        'Sector',
        'Especialidad',
        'Comienzo',
        'Duración',
      ],
      [
        'INF-002',
        'LIMPIEZA DEL TERRENO MANUAL',
        'EXPLANACION GENERAL',
        'CANCHA PRINCIPAL',
        'Movimiento de Tierras',
        '11/05/2026',
        '3 días',
      ],
    ]);

    const result = parseScheduleExcel(buffer);
    expect(result.columnsMissing).toHaveLength(0);
    expect(result.rows[0].input?.fechaInicio.toISOString().slice(0, 10)).toBe('2026-05-11');
    expect(result.rows[0].input?.duracionDias).toBe(3);
  });

  it('reporta sector obligatorio vacío', () => {
    const buffer = buildBuffer([
      [
        'codigo',
        'descripcion',
        'partida_nombre',
        'sector_nombre',
        'especialidad_nombre',
        'fecha_inicio',
        'duracion_dias',
      ],
      ['INF-003', 'Tarea sin sector', 'PARTIDA X', '', 'Obras Civiles', '2026-04-21', 2],
    ]);

    const result = parseScheduleExcel(buffer);
    expect(result.rows[0].input).toBeNull();
    expect(result.rows[0].errors.some((e) => e.field === 'sector_nombre')).toBe(true);
  });
});
