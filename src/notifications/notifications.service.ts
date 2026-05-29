import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { PushDeviceService } from './push-device.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly pushDevices: PushDeviceService,
  ) {}

  listMine(userId: Types.ObjectId) {
    return this.notificationModel.find({ toUserId: userId }).sort({ createdAt: -1 }).limit(200).lean().exec();
  }

  async unreadCount(userId: Types.ObjectId): Promise<{ count: number }> {
    const count = await this.notificationModel
      .countDocuments({ toUserId: userId, readAt: null })
      .exec();
    return { count };
  }

  async markRead(userId: Types.ObjectId, notificationId: Types.ObjectId) {
    const doc = await this.notificationModel.findOne({ _id: notificationId, toUserId: userId }).exec();
    if (!doc) throw new NotFoundException('Notificación no encontrada');
    doc.readAt = new Date();
    await doc.save();
    return doc.toObject();
  }

  async markAllRead(userId: Types.ObjectId): Promise<{ updated: number }> {
    const result = await this.notificationModel
      .updateMany({ toUserId: userId, readAt: null }, { $set: { readAt: new Date() } })
      .exec();
    return { updated: result.modifiedCount };
  }

  registerPushToken(userId: Types.ObjectId, dto: RegisterPushTokenDto): Promise<void> {
    return this.pushDevices.register(userId, dto);
  }
}
