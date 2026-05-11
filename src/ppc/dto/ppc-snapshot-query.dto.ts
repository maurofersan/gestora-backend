import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsMongoId } from 'class-validator';

export class PpcSnapshotQueryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  specialtyId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Ancla de semana (se usa el rango lunes–domingo que la contiene)',
  })
  @Type(() => Date)
  @IsDate()
  weekAnchor: Date;
}
