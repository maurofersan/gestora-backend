import { ApiProperty } from '@nestjs/swagger';

export class PpcSnapshotMetaDto {
  @ApiProperty({ description: 'IANA TZ del proyecto (obra)', example: 'America/Lima' })
  projectTimeZone!: string;

  @ApiProperty({
    description: 'Valor enviado por el cliente (YYYY-MM-DD).',
    example: '2026-05-11',
  })
  weekAnchorRequested!: string;

  @ApiProperty({
    description:
      'Lunes normalizado de la semana en calendario de la zona del proyecto (puede diferir si el cliente no envió lunes).',
    example: '2026-05-11',
  })
  weekStartMonday!: string;

  @ApiProperty({ example: '2026-05-11T05:00:00.000Z' })
  weekStartUtc!: string;

  @ApiProperty({ example: '2026-05-18T04:59:59.999Z' })
  weekEndUtc!: string;

  @ApiProperty({ example: '2026-05-11 — 2026-05-17' })
  weekLabel!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  specialtyId!: string;
}

export class PpcSnapshotSummaryDto {
  @ApiProperty()
  plannedTotal!: number;

  @ApiProperty()
  completedTotal!: number;

  @ApiProperty()
  ppcPercent!: number;

  @ApiProperty({ required: false, nullable: true })
  generatedAt?: string | null;
}

export class PpcActivityRowDto {
  @ApiProperty()
  activityId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: ['pending', 'done'] })
  status!: string;

  @ApiProperty({ enum: ['green', 'yellow', 'red'] })
  statusColor!: string;

  @ApiProperty()
  wasPlanned!: boolean;

  @ApiProperty()
  wasCompleted!: boolean;
}

export class PpcWorkPackageGroupDto {
  @ApiProperty()
  workPackageId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty({ type: [PpcActivityRowDto] })
  activities!: PpcActivityRowDto[];
}

export class PpcSnapshotResponseDto {
  @ApiProperty({ type: PpcSnapshotMetaDto })
  meta!: PpcSnapshotMetaDto;

  @ApiProperty({
    type: PpcSnapshotSummaryDto,
    nullable: true,
    description: 'Nulo si no hay snapshot persistido para projectId + specialtyId + semana.',
  })
  summary!: PpcSnapshotSummaryDto | null;

  @ApiProperty({
    type: [PpcWorkPackageGroupDto],
    description: 'Partidas con actividades enriquecidas para la semana filtrada.',
  })
  workPackages!: PpcWorkPackageGroupDto[];
}
