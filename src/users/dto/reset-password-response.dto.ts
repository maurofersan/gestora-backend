import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ example: 'Contraseña restablecida. Comparte la temporal con el usuario.' })
  message: string;

  @ApiProperty({
    description: 'Contraseña temporal de un solo uso (mostrar al planificador para compartir)',
    example: 'Xk9#mNp2QrTv',
  })
  temporaryPassword: string;

  @ApiProperty({ description: 'Usuario afectado (sin datos sensibles)' })
  user: Record<string, unknown>;
}
