import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';

@Injectable()
export class NotificationAudienceService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async companyUsersOnProject(
    projectId: Types.ObjectId,
    options?: { excludeUserIds?: Types.ObjectId[] },
  ): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({
        projectIds: projectId,
        status: 'active',
        type: UserType.COMPANY,
      })
      .select('_id')
      .lean()
      .exec();

    return this.applyExclusions(
      users.map((u) => u._id),
      options?.excludeUserIds,
    );
  }

  /** Empresa del proyecto, sin cliente (retrasos / por terminar). */
  async companyUsersExcludingClient(
    projectId: Types.ObjectId,
    options?: { excludeUserIds?: Types.ObjectId[] },
  ): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({
        projectIds: projectId,
        status: 'active',
        type: UserType.COMPANY,
        role: { $ne: UserRole.CLIENTE },
      })
      .select('_id')
      .lean()
      .exec();

    return this.applyExclusions(
      users.map((u) => u._id),
      options?.excludeUserIds,
    );
  }

  /** Todos los usuarios con acceso al proyecto (incluye cliente). */
  async allUsersOnProject(
    projectId: Types.ObjectId,
    options?: { excludeUserIds?: Types.ObjectId[] },
  ): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({ projectIds: projectId, status: 'active' })
      .select('_id')
      .lean()
      .exec();

    return this.applyExclusions(
      users.map((u) => u._id),
      options?.excludeUserIds,
    );
  }

  async clientUserId(projectId: Types.ObjectId): Promise<Types.ObjectId | null> {
    const project = await this.projectModel.findById(projectId).select('clientUserId').lean().exec();
    return project?.clientUserId ?? null;
  }

  async planificadoresOnProject(projectId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({
        projectIds: projectId,
        status: 'active',
        role: UserRole.ULTIMO_PLANIFICADOR,
      })
      .select('_id')
      .lean()
      .exec();
    return users.map((u) => u._id);
  }

  private applyExclusions(
    userIds: Types.ObjectId[],
    excludeUserIds?: Types.ObjectId[],
  ): Types.ObjectId[] {
    if (!excludeUserIds?.length) return userIds;
    const excluded = new Set(excludeUserIds.map((id) => id.toString()));
    return userIds.filter((id) => !excluded.has(id.toString()));
  }
}
