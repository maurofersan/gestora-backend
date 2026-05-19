import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ActivityWorkflowStatus } from '../../common/enums/activity-workflow.enum';
import { ActivityStatusColor } from '../../common/enums/activity-color.enum';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ _id: false })
export class PlannedWindow {
  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  durationDays: number;

  @Prop({ required: true })
  end: Date;
}

@Schema({ _id: false })
export class ActualWindow {
  @Prop({ type: Date, default: null })
  start: Date | null;

  @Prop({ type: Number, default: null })
  durationDays: number | null;

  @Prop({ type: Date, default: null })
  end: Date | null;
}

@Schema({ _id: true })
export class ActivityRestriction {
  @Prop({ required: true })
  text: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

import {
  NonComplianceEvent,
  NonComplianceEventSchema,
} from './non-compliance-event.schema';

const PlannedWindowSchema = SchemaFactory.createForClass(PlannedWindow);
const ActualWindowSchema = SchemaFactory.createForClass(ActualWindow);
const RestrictionSchema = SchemaFactory.createForClass(ActivityRestriction);

@Schema({ timestamps: true, collection: 'activities' })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkPackage', required: true })
  workPackageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Specialty', required: true })
  specialtyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sector', required: true })
  sectorId: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: PlannedWindowSchema, required: true })
  planned: PlannedWindow;

  @Prop({ type: ActualWindowSchema, required: true })
  actual: ActualWindow;

  @Prop({ enum: ActivityWorkflowStatus, default: ActivityWorkflowStatus.PENDING })
  status: ActivityWorkflowStatus;

  @Prop({ enum: ActivityStatusColor, required: true })
  statusColor: ActivityStatusColor;

  @Prop({ type: [RestrictionSchema], default: [] })
  restrictions: ActivityRestriction[];

  @Prop({ type: [NonComplianceEventSchema], default: [] })
  nonComplianceEvents: NonComplianceEvent[];

  @Prop({ default: 0 })
  evidenceCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ projectId: 1, code: 1 }, { unique: true });
ActivitySchema.index({ projectId: 1, sectorId: 1, workPackageId: 1 });
ActivitySchema.index({ projectId: 1, specialtyId: 1 });
ActivitySchema.index({ projectId: 1, 'planned.end': 1 });
ActivitySchema.index({ projectId: 1, status: 1, statusColor: 1 });
