import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { Project, ProjectDocument } from '../../projects/schemas/project.schema';

/**
 * Verifica que `projectId` (param o body) pertenezca al usuario:
 * - cliente: solo su proyecto asignado (projectIds)
 * - empresa: mismo companyId del proyecto y proyecto en projectIds (asignación explícita)
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
      params: Record<string, string>;
      body: Record<string, unknown>;
    }>();
    const user = req.user;
    if (!user) throw new ForbiddenException();

    const raw =
      req.params?.projectId ??
      (typeof req.body?.projectId === 'string' ? req.body.projectId : undefined);
    if (!raw || !Types.ObjectId.isValid(raw)) {
      throw new NotFoundException('Proyecto inválido');
    }
    const projectId = new Types.ObjectId(raw);

    const allowed = user.projectIds.some((id) => id.equals(projectId));
    if (!allowed) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    if (user.type === 'company' && user.companyId) {
      if (!project.companyId.equals(user.companyId)) {
        throw new ForbiddenException('Proyecto no pertenece a tu empresa');
      }
    }

    if (user.type === 'client') {
      if (!project.clientUserId.equals(user._id)) {
        throw new ForbiddenException('Este proyecto no es tuyo');
      }
    }

    return true;
  }
}
