import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  listMine(userId: Types.ObjectId) {
    return this.notificationModel.find({ toUserId: userId }).sort({ createdAt: -1 }).limit(200).lean().exec();
  }

  async markRead(userId: Types.ObjectId, notificationId: Types.ObjectId) {
    const doc = await this.notificationModel.findOne({ _id: notificationId, toUserId: userId }).exec();
    if (!doc) throw new NotFoundException('Notificación no encontrada');
    doc.readAt = new Date();
    await doc.save();
    return doc.toObject();
  }
}
