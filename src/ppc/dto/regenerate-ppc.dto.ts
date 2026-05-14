import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, Matches } from 'class-validator';
import { WEEK_ANCHOR_ISO_DATE_PATTERN } from '../../common/planning-week/resolve-planning-week';

export class RegeneratePpcDto {
  @ApiProperty({ description: 'Especialidad del PPC', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  specialtyId: string;

  @ApiProperty({
    example: '2026-05-11',
    description:
      'Misma semántica que GET /ppc: YYYY-MM-DD civil en la zona del proyecto (lunes de la semana de planificación).',
    pattern: WEEK_ANCHOR_ISO_DATE_PATTERN.source,
  })
  @IsString()
  @Matches(WEEK_ANCHOR_ISO_DATE_PATTERN)
  weekAnchor: string;
}
