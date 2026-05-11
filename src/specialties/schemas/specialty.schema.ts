import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SpecialtyDocument = HydratedDocument<Specialty>;

@Schema({ timestamps: true, collection: 'specialties' })
export class Specialty {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const SpecialtySchema = SchemaFactory.createForClass(Specialty);
SpecialtySchema.index({ companyId: 1, name: 1 }, { unique: true });
