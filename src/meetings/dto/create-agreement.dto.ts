import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAgreementDto {
  @ApiProperty({ example: 'Enviar planos actualizados al cliente antes del viernes' })
  @IsString()
  @MinLength(1)
  text: string;
}
