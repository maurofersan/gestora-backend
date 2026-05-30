import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ossian@empresa.com' })
  @IsEmail()
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example:
      'Si el correo pertenece a un usuario de empresa activo, recibirás un email con una contraseña temporal.',
  })
  message: string;
}
