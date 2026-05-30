import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SendEmailInput, SendEmailResult } from './email.types';

type ResendApiResponse = {
  id?: string;
  message?: string;
};

@Injectable()
export class ResendEmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const from = this.configService.get<string>('EMAIL_FROM')?.trim();

    if (!apiKey || !from) {
      this.logger.warn(
        `Email no enviado (RESEND_API_KEY o EMAIL_FROM vacíos). Destino: ${input.to} — asunto: ${input.subject}`,
      );
      return { sent: false };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ResendApiResponse;
      this.logger.error(
        `Resend error ${response.status}: ${body.message ?? response.statusText}`,
      );
      return { sent: false };
    }

    const body = (await response.json()) as ResendApiResponse;
    return { sent: true, providerId: body.id };
  }
}
