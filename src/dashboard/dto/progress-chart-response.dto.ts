import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgressChartPointDto {
  @ApiProperty({ example: '2026-05-25' })
  weekStartMonday!: string;

  @ApiProperty({ example: '2026-05-25 — 2026-05-31' })
  weekLabel!: string;

  @ApiProperty()
  weekStart!: string;

  @ApiProperty()
  weekEnd!: string;

  @ApiProperty()
  plannedTotal!: number;

  @ApiProperty()
  completedTotal!: number;

  @ApiProperty()
  ppcPercent!: number;

  @ApiProperty({
    description: 'true si este punto es la semana calendario actual del proyecto',
  })
  isCurrentWeek!: boolean;
}

export class ProgressChartMetaDto {
  @ApiProperty({ example: 'America/Santiago' })
  projectTimeZone!: string;

  @ApiProperty({
    description: 'Lunes de la semana calendario actual (TZ del proyecto)',
    example: '2026-06-02',
  })
  currentWeekAnchor!: string;

  @ApiProperty({ example: '2026-06-02 — 2026-06-08' })
  currentWeekLabel!: string;

  @ApiPropertyOptional({
    description: 'PPC de la semana calendario actual; null si no hay actividades planificadas esa semana',
  })
  currentWeekPpcPercent!: number | null;

  @ApiProperty()
  currentWeekPlannedTotal!: number;

  @ApiProperty()
  currentWeekCompletedTotal!: number;

  @ApiPropertyOptional({ example: '2026-04-20' })
  horizonStartMonday!: string | null;

  @ApiPropertyOptional({ example: '2026-07-06' })
  horizonEndMonday!: string | null;

  @ApiPropertyOptional({
    description: 'Presente si se filtró por especialidad',
  })
  specialtyId?: string;
}

export class ProgressChartResponseDto {
  @ApiProperty({ type: ProgressChartMetaDto })
  meta!: ProgressChartMetaDto;

  @ApiProperty({
    type: [ProgressChartPointDto],
    description: 'Serie semanal consecutiva (una fila por lunes), calculada desde activities',
  })
  points!: ProgressChartPointDto[];
}
