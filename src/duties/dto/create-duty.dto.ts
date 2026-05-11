import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateDutyDto {
  @ApiProperty({ description: 'Descripción de la urgencia / deber', example: 'Enviar factura actualizada en PDF' })
  @IsString()
  @MinLength(1)
  description: string;
}
