import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';
import { PasswordCredentialsService } from './password-credentials.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PASSWORD_MIN_LENGTH } from '../common/utils/password.util';

export type ResetPasswordByPlannerResult = {
  temporaryPassword: string;
  user: AuthenticatedUser;
};

@Injectable()
export class UsersPasswordService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly passwordCredentials: PasswordCredentialsService,
  ) {}

  async resetPasswordByPlanner(
    actor: AuthenticatedUser,
    targetUserId: Types.ObjectId,
  ): Promise<ResetPasswordByPlannerResult> {
    if (actor.role !== UserRole.ULTIMO_PLANIFICADOR) {
      throw new ForbiddenException('Solo el último planificador puede restablecer contraseñas');
    }
    if (!actor.companyId) {
      throw new ForbiddenException('Sin empresa asignada');
    }

    const target = await this.userModel.findById(targetUserId).exec();
    if (!target || target.status !== 'active') {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (!target.companyId?.equals(actor.companyId)) {
      throw new ForbiddenException('El usuario no pertenece a tu empresa');
    }

    const temporaryPassword = await this.applyTemporaryPassword(target);
    const user = this.mapDocumentToAuth(target);
    return { temporaryPassword, user };
  }

  async changeOwnPassword(
    actor: AuthenticatedUser,
    dto: ChangePasswordDto,
  ): Promise<AuthenticatedUser> {
    const user = await this.userModel.findById(actor._id).select('+passwordHash').exec();
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Usuario no válido');
    }

    const currentOk = await this.passwordCredentials.compare(dto.currentPassword, user.passwordHash);
    if (!currentOk) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta a la actual');
    }

    if (dto.newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }

    user.passwordHash = await this.passwordCredentials.hash(dto.newPassword);
    user.mustChangePassword = false;
    await user.save();

    return this.mapDocumentToAuth(user);
  }

  /** Solo usuarios de empresa (self-service forgot password). */
  async assignTemporaryPasswordForCompanyEmail(email: string): Promise<{
    user: UserDocument;
    temporaryPassword: string;
  } | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase(), status: 'active', type: UserType.COMPANY })
      .exec();

    if (!user) return null;

    const temporaryPassword = await this.applyTemporaryPassword(user);
    return { user, temporaryPassword };
  }

  private async applyTemporaryPassword(user: UserDocument): Promise<string> {
    const temporaryPassword = this.passwordCredentials.generateTemporary();
    user.passwordHash = await this.passwordCredentials.hash(temporaryPassword);
    user.mustChangePassword = true;
    await user.save();
    return temporaryPassword;
  }

  private mapDocumentToAuth(user: UserDocument): AuthenticatedUser {
    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      type: user.type,
      companyId: user.companyId,
      specialtyId: user.specialtyId,
      projectIds: user.projectIds ?? [],
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}
