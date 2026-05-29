import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PushDeviceDocument = HydratedDocument<PushDevice>;

@Schema({ timestamps: true, collection: 'pushdevices' })
export class PushDevice {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  expoPushToken: string;

  @Prop({ enum: ['ios', 'android'], required: true })
  platform: 'ios' | 'android';
}

export const PushDeviceSchema = SchemaFactory.createForClass(PushDevice);
PushDeviceSchema.index({ userId: 1, updatedAt: -1 });
