import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return undefined;
}

export class ScheduleImportOptionsDto {
  @ApiPropertyOptional({
    description: 'Crear sectores inexistentes por nombre',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value) ?? true)
  createMissingSectors?: boolean = true;

  @ApiPropertyOptional({
    description: 'Crear partidas inexistentes (nombre + especialidad)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value) ?? true)
  createMissingWorkPackages?: boolean = true;

  @ApiPropertyOptional({
    description: 'Vincular resultado a un registro previo de schedule-uploads',
  })
  @IsOptional()
  @IsMongoId()
  scheduleUploadId?: string;
}
