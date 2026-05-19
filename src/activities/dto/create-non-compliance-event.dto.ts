import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AffectedWeekDto } from './patch-non-compliance.dto';

export class CreateNonComplianceEventDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  causesText?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Medida correctiva' })
  @IsOptional()
  @IsString()
  correctiveActionsText?: string | null;

  @ApiPropertyOptional({ type: [AffectedWeekDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AffectedWeekDto)
  affectedWeeks?: AffectedWeekDto[];
}
