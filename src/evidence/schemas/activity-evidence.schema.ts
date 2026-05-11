import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityEvidenceDocument = HydratedDocument<ActivityEvidence>;

@Schema({ timestamps: true, collection: 'activityevidences' })
export class ActivityEvidence {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ type: String, default: null })
  thumbUrl: string | null;

  @Prop({
    type: {
      width: { type: Number, required: false },
      height: { type: Number, required: false },
      sizeBytes: { type: Number, required: false },
      mime: { type: String, required: false },
    },
    default: undefined,
  })
  meta?: { width?: number; height?: number; sizeBytes?: number; mime?: string };
}

export const ActivityEvidenceSchema = SchemaFactory.createForClass(ActivityEvidence);
ActivityEvidenceSchema.index({ activityId: 1, createdAt: -1 });
ActivityEvidenceSchema.index({ projectId: 1, createdAt: -1 });
