import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async listForUser(user: AuthenticatedUser) {
    const ids = user.projectIds.map((id) => id.toString());
    if (!ids.length) return [];
    return this.projectModel.find({ _id: { $in: ids } }).sort({ updatedAt: -1 }).lean().exec();
  }

  async getForUser(user: AuthenticatedUser, projectId: Types.ObjectId) {
    const p = await this.projectModel.findById(projectId).lean().exec();
    if (!p) throw new NotFoundException('Proyecto no encontrado');
    const ok = user.projectIds.some((id) => id.equals(projectId));
    if (!ok) throw new ForbiddenException();
    return p;
  }

  async create(actor: AuthenticatedUser, dto: CreateProjectDto) {
    if (!actor.companyId) throw new ForbiddenException('Sin empresa');
    const client = await this.userModel.findById(dto.clientUserId).exec();
    if (
      !client ||
      client.type !== UserType.CLIENT ||
      client.role !== UserRole.CLIENTE
    ) {
      throw new ForbiddenException('clientUserId debe ser usuario cliente');
    }
    if (!client.companyId || !client.companyId.equals(actor.companyId)) {
      throw new ForbiddenException('Cliente no pertenece a tu empresa');
    }

    const project = await this.projectModel.create({
      companyId: actor.companyId,
      name: dto.name,
      clientUserId: new Types.ObjectId(dto.clientUserId),
      status: 'active',
      timezone: dto.timezone ?? 'UTC',
    });

    await this.userModel.updateMany(
      { _id: { $in: [actor._id, client._id] } },
      { $addToSet: { projectIds: project._id } },
    );

    return project.toObject();
  }

  async update(actor: AuthenticatedUser, projectId: Types.ObjectId, dto: UpdateProjectDto) {
    await this.getForUser(actor, projectId);
    const updated = await this.projectModel
      .findByIdAndUpdate(projectId, dto, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException();
    return updated;
  }
}
