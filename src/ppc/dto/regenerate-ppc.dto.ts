import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsMongoId } from 'class-validator';

export class RegeneratePpcDto {
  @ApiProperty({ description: 'Especialidad del PPC', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  specialtyId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Cualquier fecha dentro de la semana; el backend normaliza a lunes–domingo (MVP: TZ del servidor)',
  })
  @Type(() => Date)
  @IsDate()
  weekAnchor: Date;
}
