import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({ timestamps: true, collection: 'meetings' })
export class Meeting {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MeetingArea', required: true })
  areaId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  meetingDate: Date;

  @Prop({ enum: ['open', 'closed'], default: 'open' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
MeetingSchema.index({ projectId: 1, areaId: 1, meetingDate: -1 });
