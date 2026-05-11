import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapDto {
  @ApiProperty({ description: 'Nombre de la empresa', example: 'Mi empresa SA' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Nombre completo del administrador inicial', example: 'Admin Gestora' })
  @IsString()
  adminFullName: string;

  @ApiProperty({ description: 'Email del usuario último planificador inicial', example: 'admin@empresa.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ description: 'Contraseña del administrador (mín. 8 caracteres)', format: 'password', minLength: 8 })
  @MinLength(8)
  adminPassword: string;
}
