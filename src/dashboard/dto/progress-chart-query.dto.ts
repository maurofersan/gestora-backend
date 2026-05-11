import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class ProgressChartQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra snapshots PPC por especialidad; si se omite, todas las del proyecto',
  })
  @IsOptional()
  @IsMongoId()
  specialtyId?: string;
}
