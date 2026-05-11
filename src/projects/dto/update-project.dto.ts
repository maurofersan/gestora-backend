import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const PROJECT_STATUSES = ['active', 'in_progress', 'closed'] as const;

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Proyecto Horizonte Norte — Fase 2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional({ example: 'America/Santiago' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
