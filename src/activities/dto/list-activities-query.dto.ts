import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsOptional } from 'class-validator';

export class ListActivitiesQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por sector' })
  @IsOptional()
  @IsMongoId()
  sectorId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por partida' })
  @IsOptional()
  @IsMongoId()
  workPackageId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por especialidad' })
  @IsOptional()
  @IsMongoId()
  specialtyId?: string;

  @ApiPropertyOptional({
    description: 'Ventana semanal: actividades cuyo plan intersecta [weekStart, weekEnd]',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  weekStart?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  weekEnd?: Date;
}
