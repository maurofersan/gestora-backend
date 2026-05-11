import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toUserId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    type: {
      activityId: { type: Types.ObjectId, ref: 'Activity', required: false },
      dutyId: { type: Types.ObjectId, ref: 'Duty', required: false },
      meetingId: { type: Types.ObjectId, ref: 'Meeting', required: false },
    },
    default: {},
  })
  data: {
    activityId?: Types.ObjectId;
    dutyId?: Types.ObjectId;
    meetingId?: Types.ObjectId;
  };

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ toUserId: 1, readAt: 1, createdAt: -1 });
