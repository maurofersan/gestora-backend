import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserType } from '../../common/enums/user-type.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Company', default: null })
  companyId: Types.ObjectId | null;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ enum: UserType, required: true })
  type: UserType;

  @Prop({ enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Specialty', default: null })
  specialtyId: Types.ObjectId | null;

  /** Proyectos visibles para este usuario (empresa y cliente). */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], default: [] })
  projectIds: Types.ObjectId[];

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ companyId: 1, role: 1 });
UserSchema.index({ projectIds: 1 });
