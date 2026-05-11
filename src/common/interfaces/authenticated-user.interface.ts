import { Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { UserType } from '../enums/user-type.enum';

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  role: UserRole;
  type: UserType;
  companyId: Types.ObjectId | null;
  specialtyId: Types.ObjectId | null;
  projectIds: Types.ObjectId[];
  passwordHash?: string;
}
