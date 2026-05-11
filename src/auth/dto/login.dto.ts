import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email del usuario', example: 'admin@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña', format: 'password' })
  @IsString()
  @MinLength(1)
  password: string;
}
