import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['active', 'in_progress', 'closed'], default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientUserId: Types.ObjectId;

  /** IANA ej. America/Santiago — usar en app móvil para semanas correctas. */
  @Prop({ default: 'UTC' })
  timezone: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ companyId: 1, status: 1 });
ProjectSchema.index({ clientUserId: 1 });
ProjectSchema.index({ companyId: 1, name: 1 });
