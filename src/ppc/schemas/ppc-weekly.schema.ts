import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PpcWeeklyDocument = HydratedDocument<PpcWeekly>;

@Schema({ _id: false })
export class PpcWeeklyItem {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkPackage', required: true })
  workPackageId: Types.ObjectId;

  @Prop({ required: true })
  activityCode: string;

  @Prop({ default: true })
  wasPlanned: boolean;

  @Prop({ required: true })
  wasCompleted: boolean;
}

const PpcWeeklyItemSchema = SchemaFactory.createForClass(PpcWeeklyItem);

@Schema({ timestamps: true, collection: 'ppcweeklies' })
export class PpcWeekly {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Specialty', required: true })
  specialtyId: Types.ObjectId;

  @Prop({ required: true })
  weekStart: Date;

  @Prop({ required: true })
  weekEnd: Date;

  @Prop({ default: '' })
  weekLabel: string;

  @Prop({ default: 0 })
  plannedTotal: number;

  @Prop({ default: 0 })
  completedTotal: number;

  @Prop({ default: 0 })
  ppcPercent: number;

  @Prop({ type: [PpcWeeklyItemSchema], default: [] })
  items: PpcWeeklyItem[];

  @Prop({ default: () => new Date() })
  generatedAt: Date;
}

export const PpcWeeklySchema = SchemaFactory.createForClass(PpcWeekly);
PpcWeeklySchema.index({ projectId: 1, specialtyId: 1, weekStart: 1 }, { unique: true });
PpcWeeklySchema.index({ projectId: 1, weekStart: -1 });
