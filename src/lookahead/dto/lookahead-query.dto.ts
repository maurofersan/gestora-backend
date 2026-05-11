import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class LookaheadQueryDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Ancla para obtener el lookahead de esa semana',
  })
  @Type(() => Date)
  @IsDate()
  weekAnchor: Date;
}
