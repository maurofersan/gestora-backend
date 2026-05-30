import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from '../integrations/email/resend-email.service';

@Injectable()
export class PasswordResetEmailService {
  constructor(
    private readonly emailService: ResendEmailService,
    private readonly configService: ConfigService,
  ) {}

  sendTemporaryPassword(input: {
    toEmail: string;
    fullName: string;
    temporaryPassword: string;
  }): Promise<{ sent: boolean }> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'Gestora';

    return this.emailService
      .send({
        to: input.toEmail,
        subject: `${appName} — contraseña temporal`,
        text: [
          `Hola ${input.fullName},`,
          '',
          `Recibimos una solicitud para restablecer tu contraseña en ${appName}.`,
          '',
          `Tu contraseña temporal es: ${input.temporaryPassword}`,
          '',
          'Inicia sesión en la app con esa contraseña. Se te pedirá definir una nueva contraseña antes de continuar.',
          '',
          'Si no solicitaste este cambio, contacta a tu administrador.',
        ].join('\n'),
      })
      .then((result) => ({ sent: result.sent }));
  }
}
