import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, Matches } from 'class-validator';
import { WEEK_ANCHOR_ISO_DATE_PATTERN } from '../../common/planning-week/resolve-planning-week';

export class PpcSnapshotQueryDto {
  @ApiProperty({ description: 'Especialidad del snapshot', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  specialtyId: string;

  @ApiProperty({
    example: '2026-05-11',
    description:
      'Fecha civil YYYY-MM-DD en el calendario de la zona del proyecto (`projects.timezone`, IANA). ' +
      'Representa la ancla de semana (típicamente el lunes ISO de inicio de semana de planificación). ' +
      'No usar ISO-8601 con hora en Z como sustituto de “fecha local”: se interpreta como calendario en la TZ del proyecto.',
    pattern: WEEK_ANCHOR_ISO_DATE_PATTERN.source,
  })
  @IsString()
  @Matches(WEEK_ANCHOR_ISO_DATE_PATTERN)
  weekAnchor: string;
}
