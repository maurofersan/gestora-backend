import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SectorDocument = HydratedDocument<Sector>;

@Schema({ timestamps: true, collection: 'sectors' })
export class Sector {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  order: number;
}

export const SectorSchema = SchemaFactory.createForClass(Sector);
SectorSchema.index({ projectId: 1, order: 1 });
SectorSchema.index({ projectId: 1, name: 1 });
