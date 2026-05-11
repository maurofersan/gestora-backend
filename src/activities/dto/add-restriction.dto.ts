import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddRestrictionDto {
  @ApiProperty({ example: 'Acceso limitado por lluvia en zona norte' })
  @IsString()
  @MinLength(1)
  text: string;
}
