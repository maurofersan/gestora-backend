import { ApiProperty } from '@nestjs/swagger';

export class ScheduleImportRowErrorDto {
  @ApiProperty({ required: false })
  field?: string;

  @ApiProperty()
  message: string;
}

export class ScheduleImportPreviewRowDto {
  @ApiProperty()
  rowNumber: number;

  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [ScheduleImportRowErrorDto] })
  errors: ScheduleImportRowErrorDto[];

  @ApiProperty({ nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  resolution: Record<string, boolean> | null;

  @ApiProperty({ enum: ['create', 'update', 'skip'], nullable: true })
  action: 'create' | 'update' | 'skip' | null;
}

export class ScheduleImportPreviewSummaryDto {
  @ApiProperty()
  wouldCreateActivities: number;

  @ApiProperty()
  wouldUpdateActivities: number;

  @ApiProperty()
  wouldSkipActivities: number;

  @ApiProperty()
  wouldCreateSectors: number;

  @ApiProperty()
  wouldCreateWorkPackages: number;

  @ApiProperty()
  invalidRows: number;
}

export class ScheduleImportPreviewResponseDto {
  @ApiProperty({ type: [String] })
  columnsFound: string[];

  @ApiProperty({ type: [String] })
  columnsMissing: string[];

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  validRows: number;

  @ApiProperty({ type: [ScheduleImportPreviewRowDto] })
  rows: ScheduleImportPreviewRowDto[];

  @ApiProperty({ type: ScheduleImportPreviewSummaryDto })
  summary: ScheduleImportPreviewSummaryDto;
}
