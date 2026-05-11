import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMeetingAreaDto {
  @ApiProperty({ example: 'Área de Producción' })
  @IsString()
  @MinLength(1)
  name: string;
}
