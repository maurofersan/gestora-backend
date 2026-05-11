import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkPackageDocument = HydratedDocument<WorkPackage>;

/** Partida: agrupa actividades bajo una sola especialidad (document.md). */
@Schema({ timestamps: true, collection: 'workpackages' })
export class WorkPackage {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Specialty', required: true })
  specialtyId: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;
}

export const WorkPackageSchema = SchemaFactory.createForClass(WorkPackage);
WorkPackageSchema.index({ projectId: 1, order: 1 });
WorkPackageSchema.index({ projectId: 1, specialtyId: 1 });
