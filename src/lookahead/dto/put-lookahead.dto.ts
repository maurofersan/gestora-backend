import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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
  @ApiProperty({ type: String, format: 'date-time', description: 'Semana del lookahead' })
  @Type(() => Date)
  @IsDate()
  weekAnchor: Date;

  @ApiProperty({ type: [LookaheadItemDto], description: 'Actividades incluidas en el lookahead' })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => LookaheadItemDto)
  items: LookaheadItemDto[];
}
