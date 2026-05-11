import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Sector 1 — Frente norte' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Orden en listas UI', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}
