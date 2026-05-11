import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ActivityWorkflowStatus } from '../../common/enums/activity-workflow.enum';

export class UpdateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedStart?: Date;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  plannedDurationDays?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualStart?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  actualDurationDays?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEnd?: Date | null;

  @ApiPropertyOptional({ enum: ActivityWorkflowStatus, enumName: 'ActivityWorkflowStatus' })
  @IsOptional()
  @IsEnum(ActivityWorkflowStatus)
  status?: ActivityWorkflowStatus;
}
