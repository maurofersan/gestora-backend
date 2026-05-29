import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import type { NotificationPushData } from './expo-push.types';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN');
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data: NotificationPushData,
  ): Promise<string[]> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      return [];
    }

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }));

    const invalidTokens: string[] = [];
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, index) => {
          if (ticket.status === 'error') {
            const token = chunk[index]?.to as string;
            if (ticket.details?.error === 'DeviceNotRegistered' && token) {
              invalidTokens.push(token);
            }
            this.logger.warn(
              `Expo push error (${token}): ${ticket.message ?? ticket.details?.error}`,
            );
          }
        });
      } catch (error) {
        this.logger.error('Expo push chunk failed', error instanceof Error ? error.stack : error);
      }
    }

    return invalidTokens;
  }
}
