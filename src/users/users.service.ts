import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';
import { PasswordCredentialsService } from './password-credentials.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly passwordCredentials: PasswordCredentialsService,
  ) {}

  async findSafeById(id: string): Promise<AuthenticatedUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .lean()
      .exec();
    if (!doc) return null;
    return this.mapLeanToAuth(doc);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return this.passwordCredentials.compare(password, user.passwordHash);
  }

  async createByPlanner(actor: AuthenticatedUser, dto: CreateUserDto): Promise<AuthenticatedUser> {
    if (!actor.companyId) {
      throw new UnauthorizedException('Sin empresa asignada');
    }
    if (dto.role === UserRole.ESPECIALISTA && !dto.specialtyId) {
      throw new ConflictException('Especialista requiere specialtyId');
    }
    const exists = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email ya registrado');

    const passwordHash = await this.passwordCredentials.hash(dto.password);
    const projectIds = (dto.projectIds ?? []).map((id) => new Types.ObjectId(id));

    const created = await this.userModel.create({
      companyId: actor.companyId,
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      phone: dto.phone ?? null,
      passwordHash,
      type: dto.type,
      role: dto.role,
      specialtyId: dto.specialtyId ? new Types.ObjectId(dto.specialtyId) : null,
      projectIds,
      status: 'active',
    });

    const safe = await this.findSafeById(created._id.toString());
    if (!safe) throw new NotFoundException();
    return safe;
  }

  async listByProject(projectId: Types.ObjectId): Promise<AuthenticatedUser[]> {
    const docs = await this.userModel
      .find({ projectIds: projectId })
      .select('-passwordHash')
      .lean()
      .exec();
    return docs.map((d) => this.mapLeanToAuth(d));
  }

  private mapLeanToAuth(doc: User & { _id: Types.ObjectId }): AuthenticatedUser {
    return {
      _id: doc._id,
      email: doc.email,
      fullName: doc.fullName,
      role: doc.role as UserRole,
      type: doc.type as UserType,
      companyId: doc.companyId,
      specialtyId: doc.specialtyId,
      projectIds: doc.projectIds ?? [],
      mustChangePassword: doc.mustChangePassword ?? false,
    };
  }
}
