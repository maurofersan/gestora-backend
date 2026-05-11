import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LookaheadWeeklyDocument = HydratedDocument<LookaheadWeekly>;

@Schema({ _id: false })
export class LookaheadItem {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ enum: ['committed', 'tentative'], default: 'committed' })
  commitment: string;

  @Prop({ type: String, default: null })
  notes: string | null;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;
}

const LookaheadItemSchema = SchemaFactory.createForClass(LookaheadItem);

@Schema({ timestamps: true, collection: 'lookaheadweeklies' })
export class LookaheadWeekly {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  weekStart: Date;

  @Prop({ required: true })
  weekEnd: Date;

  @Prop({ type: [LookaheadItemSchema], default: [] })
  items: LookaheadItem[];
}

export const LookaheadWeeklySchema = SchemaFactory.createForClass(LookaheadWeekly);
LookaheadWeeklySchema.index({ projectId: 1, weekStart: 1 }, { unique: true });
