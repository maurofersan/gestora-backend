import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType } from '../common/enums/notification-type.enum';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { ExpoPushService } from './integrations/expo-push.service';
import { PushDeviceService } from './push-device.service';
import type { NotificationPushData } from './integrations/expo-push.types';

export type DispatchNotificationInput = {
  projectId: Types.ObjectId;
  toUserIds: Types.ObjectId[];
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    activityId?: Types.ObjectId;
    dutyId?: Types.ObjectId;
  };
  /** Sin userId; se añade por destinatario. Ej. `activity_overdue:abc123` */
  dedupeKeyBase?: string;
};

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly expoPush: ExpoPushService,
    private readonly pushDevices: PushDeviceService,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<void> {
    const uniqueUserIds = [...new Set(input.toUserIds.map((id) => id.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    if (uniqueUserIds.length === 0) return;

    const createdDocs: NotificationDocument[] = [];

    for (const toUserId of uniqueUserIds) {
      const dedupeKey = input.dedupeKeyBase
        ? `${input.dedupeKeyBase}:${toUserId.toString()}`
        : null;

      if (dedupeKey) {
        const exists = await this.notificationModel.exists({ dedupeKey }).exec();
        if (exists) continue;
      }

      try {
        const doc = await this.notificationModel.create({
          projectId: input.projectId,
          toUserId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data ?? {},
          dedupeKey,
          readAt: null,
        });
        createdDocs.push(doc);
      } catch (error) {
        if (this.isDuplicateKeyError(error)) continue;
        throw error;
      }
    }

    if (createdDocs.length === 0) return;

    const tokensByUser = await this.pushDevices.tokensByUserMap(
      createdDocs.map((doc) => doc.toUserId),
    );

    const invalidTokens: string[] = [];

    for (const doc of createdDocs) {
      const userTokens = tokensByUser.get(doc.toUserId.toString()) ?? [];
      if (userTokens.length === 0) continue;

      const pushData: NotificationPushData = {
        type: input.type,
        projectId: input.projectId.toString(),
        notificationId: doc._id.toString(),
        activityId: input.data?.activityId?.toString(),
        dutyId: input.data?.dutyId?.toString(),
      };

      const invalid = await this.expoPush.sendToTokens(
        userTokens,
        input.title,
        input.body,
        pushData,
      );
      invalidTokens.push(...invalid);
    }

    if (invalidTokens.length > 0) {
      await this.pushDevices.removeTokens([...new Set(invalidTokens)]);
    }
  }

  /** No bloquea la petición HTTP si falla el envío. */
  dispatchAsync(input: DispatchNotificationInput): void {
    void this.dispatch(input).catch((error) => {
      this.logger.error(
        `Notification dispatch failed (${input.type})`,
        error instanceof Error ? error.stack : error,
      );
    });
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
