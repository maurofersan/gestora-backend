import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkPackageDto {
  @ApiProperty({ example: 'Partida 1 — Movimiento de tierra' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Especialidad única de esta partida', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  specialtyId: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}
