import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AgreementStatus } from '../../common/enums/agreement-status.enum';

export type AgreementDocument = HydratedDocument<Agreement>;

@Schema({ timestamps: true, collection: 'agreements' })
export class Agreement {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true })
  meetingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MeetingArea', required: true })
  areaId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ enum: AgreementStatus, default: AgreementStatus.PENDING })
  status: AgreementStatus;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolvedBy: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const AgreementSchema = SchemaFactory.createForClass(Agreement);
AgreementSchema.index({ meetingId: 1, createdAt: -1 });
AgreementSchema.index({ projectId: 1, areaId: 1, status: 1 });
