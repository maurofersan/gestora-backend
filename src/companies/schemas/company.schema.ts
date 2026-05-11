import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ name: 1 });
