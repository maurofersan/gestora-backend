import { UserRole } from '../enums/user-role.enum';
import { UserType } from '../enums/user-type.enum';

export interface JwtPayload {
  sub: string;
  fullName: string;
  email: string;
  role: UserRole;
  type: UserType;
  companyId: string | null;
  specialtyId: string | null;
  projectIds: string[];
}
