import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../common/utils/password.util';

export class ChangePasswordDto {
  @ApiProperty({ format: 'password', description: 'Contraseña actual (incluye la temporal)' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ format: 'password', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ example: 'Contraseña actualizada' })
  message: string;

  @ApiProperty({ description: 'Usuario actualizado (mustChangePassword = false)' })
  user: Record<string, unknown>;
}
