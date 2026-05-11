import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsString, MinLength } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({ example: 'Reunión de avance semanal (producción)' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Fecha y hora de la reunión' })
  @Type(() => Date)
  @IsDate()
  meetingDate: Date;
}
