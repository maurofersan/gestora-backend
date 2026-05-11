import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  workPackageId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  sectorId: string;

  @ApiProperty({ example: 'A-1024' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Instalación de tabiquería según planos' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Inicio planificado' })
  @Type(() => Date)
  @IsDate()
  plannedStart: Date;

  @ApiProperty({ example: 14, description: 'Duración planificada en días calendario' })
  @IsNumber()
  plannedDurationDays: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualStart?: Date;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  actualDurationDays?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEnd?: Date;
}
