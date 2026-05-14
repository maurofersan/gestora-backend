import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { WEEK_ANCHOR_ISO_DATE_PATTERN } from '../../common/planning-week/resolve-planning-week';

export class LookaheadQueryDto {
  @ApiProperty({
    example: '2026-05-11',
    description:
      'Ancla de semana YYYY-MM-DD civil en la zona del proyecto (`projects.timezone`). Misma regla que PPC.',
    pattern: WEEK_ANCHOR_ISO_DATE_PATTERN.source,
  })
  @IsString()
  @Matches(WEEK_ANCHOR_ISO_DATE_PATTERN)
  weekAnchor: string;
}
