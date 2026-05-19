import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ActivityStatusColor } from '../../common/enums/activity-color.enum';

@Schema({ _id: false })
export class AffectedWeekSlice {
  @Prop({ required: true })
  weekStart: Date;

  @Prop({ required: true })
  weekEnd: Date;

  @Prop({ enum: ActivityStatusColor, required: true })
  color: ActivityStatusColor;
}

export const AffectedWeekSliceSchema = SchemaFactory.createForClass(AffectedWeekSlice);

/** Un registro de incumplimiento (causas, medidas, semanas afectadas). */
@Schema({ _id: true })
export class NonComplianceEvent {
  _id: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  causesText: string | null;

  @Prop({ type: String, default: null })
  correctiveActionsText: string | null;

  @Prop({ type: [AffectedWeekSliceSchema], default: [] })
  affectedWeeks: AffectedWeekSlice[];

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;
}

export const NonComplianceEventSchema = SchemaFactory.createForClass(NonComplianceEvent);
