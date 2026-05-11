import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Estructura' })
  @IsString()
  name: string;
}
