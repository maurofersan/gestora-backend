import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleImportStatsDto {
  @ApiProperty()
  activitiesCreated: number;

  @ApiProperty()
  activitiesUpdated: number;

  @ApiProperty()
  activitiesSkipped: number;

  @ApiProperty()
  sectorsCreated: number;

  @ApiProperty()
  workPackagesCreated: number;

  @ApiProperty()
  errors: number;
}

export class ScheduleImportErrorDetailDto {
  @ApiProperty()
  rowNumber: number;

  @ApiProperty()
  message: string;
}

export class ScheduleImportPpcRegenerationDto {
  @ApiProperty()
  specialtiesProcessed: number;

  @ApiProperty()
  weeksUpserted: number;

  @ApiProperty()
  weeksRemoved: number;
}

export class ScheduleImportResultDto {
  @ApiProperty({ nullable: true })
  scheduleUploadId: string | null;

  @ApiProperty({ type: ScheduleImportStatsDto })
  stats: ScheduleImportStatsDto;

  @ApiProperty({ type: [ScheduleImportErrorDetailDto] })
  errors: ScheduleImportErrorDetailDto[];

  @ApiPropertyOptional({
    type: ScheduleImportPpcRegenerationDto,
    description: 'Regeneración de snapshots PPC/progress-chart tras importar actividades',
  })
  ppcRegeneration?: ScheduleImportPpcRegenerationDto | null;
}
