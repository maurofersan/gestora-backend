import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleUploadDocument = HydratedDocument<ScheduleUpload>;

@Schema({ timestamps: true, collection: 'scheduleuploads' })
export class ScheduleUpload {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ enum: ['mpp', 'excel', 'other'], default: 'other' })
  sourceType: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ enum: ['pending', 'parsed', 'failed'], default: 'pending' })
  parsedStatus: string;

  @Prop({
    type: {
      activitiesCreated: { type: Number, default: 0 },
      activitiesUpdated: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
    },
    default: {},
  })
  stats?: { activitiesCreated: number; activitiesUpdated: number; errors: number };
}

export const ScheduleUploadSchema = SchemaFactory.createForClass(ScheduleUpload);
ScheduleUploadSchema.index({ projectId: 1, createdAt: -1 });
