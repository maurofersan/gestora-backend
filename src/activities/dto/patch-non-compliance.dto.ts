import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActivityStatusColor } from '../../common/enums/activity-color.enum';

export class AffectedWeekDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  weekStart: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  weekEnd: Date;

  @ApiProperty({ enum: ActivityStatusColor, enumName: 'ActivityStatusColor' })
  @IsEnum(ActivityStatusColor)
  color: ActivityStatusColor;
}

export class PatchNonComplianceDto {
  @ApiPropertyOptional({ description: 'Si hay incumplimiento activo registrado' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  causesText?: string | null;

  @ApiPropertyOptional({ description: 'Medida correctiva (texto)', nullable: true })
  @IsOptional()
  @IsString()
  correctiveActionsText?: string | null;

  @ApiPropertyOptional({ type: [AffectedWeekDto], description: 'Semanas afectadas con semáforo' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AffectedWeekDto)
  affectedWeeks?: AffectedWeekDto[];
}
