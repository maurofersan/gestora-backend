import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DutyStatus } from '../../common/enums/duty-status.enum';

export type DutyDocument = HydratedDocument<Duty>;

@Schema({ timestamps: true, collection: 'duties' })
export class Duty {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: DutyStatus, default: DutyStatus.PENDING })
  status: DutyStatus;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolvedByUserId: Types.ObjectId | null;
}

export const DutySchema = SchemaFactory.createForClass(Duty);
DutySchema.index({ projectId: 1, status: 1, createdAt: -1 });
