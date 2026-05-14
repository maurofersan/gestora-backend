import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { WEEK_ANCHOR_ISO_DATE_PATTERN } from '../../common/planning-week/resolve-planning-week';

const COMMITMENT_LEVELS = ['committed', 'tentative'] as const;

export class LookaheadItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  activityId: string;

  @ApiProperty({
    enum: COMMITMENT_LEVELS,
    description: 'committed = firme, tentative = tentativo',
  })
  @IsIn(COMMITMENT_LEVELS)
  commitment: (typeof COMMITMENT_LEVELS)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class PutLookaheadDto {
  @ApiProperty({
    example: '2026-05-11',
    description: 'Semana del lookahead (YYYY-MM-DD civil en la zona del proyecto).',
    pattern: WEEK_ANCHOR_ISO_DATE_PATTERN.source,
  })
  @IsString()
  @Matches(WEEK_ANCHOR_ISO_DATE_PATTERN)
  weekAnchor: string;

  @ApiProperty({ type: [LookaheadItemDto], description: 'Actividades incluidas en el lookahead' })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => LookaheadItemDto)
  items: LookaheadItemDto[];
}
