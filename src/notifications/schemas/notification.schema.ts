import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationType } from '../../common/enums/notification-type.enum';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    type: {
      activityId: { type: Types.ObjectId, ref: 'Activity', required: false },
      dutyId: { type: Types.ObjectId, ref: 'Duty', required: false },
    },
    default: {},
  })
  data: {
    activityId?: Types.ObjectId;
    dutyId?: Types.ObjectId;
  };

  /** Evita duplicar la misma alerta al mismo usuario (cron / transiciones). */
  @Prop({ type: String, default: null })
  dedupeKey: string | null;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ toUserId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
