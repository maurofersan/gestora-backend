import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MeetingAreaDocument = HydratedDocument<MeetingArea>;

@Schema({ timestamps: true, collection: 'meetingareas' })
export class MeetingArea {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  name: string;
}

export const MeetingAreaSchema = SchemaFactory.createForClass(MeetingArea);
MeetingAreaSchema.index({ projectId: 1, name: 1 }, { unique: true });
