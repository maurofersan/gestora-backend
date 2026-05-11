import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityEvidence, ActivityEvidenceDocument } from './schemas/activity-evidence.schema';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectModel(ActivityEvidence.name)
    private readonly evidenceModel: Model<ActivityEvidenceDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async list(projectId: Types.ObjectId, activityId: Types.ObjectId) {
    await this.ensureActivity(projectId, activityId);
    return this.evidenceModel
      .find({ projectId, activityId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async create(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    dto: CreateEvidenceDto,
  ) {
    const activity = await this.ensureActivity(projectId, activityId);
    this.assertUploader(actor, activity.specialtyId);

    const doc = await this.evidenceModel.create({
      projectId,
      activityId,
      uploadedBy: actor._id,
      url: dto.url,
      thumbUrl: dto.thumbUrl ?? null,
      meta: dto.meta,
    });

    await this.activityModel.updateOne(
      { _id: activityId },
      { $inc: { evidenceCount: 1 } },
    );

    return doc.toObject();
  }

  private async ensureActivity(projectId: Types.ObjectId, activityId: Types.ObjectId) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId }).exec();
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  private assertUploader(actor: AuthenticatedUser, specialtyId: Types.ObjectId) {
    if (
      actor.role === UserRole.GERENTE ||
      actor.role === UserRole.RESIDENTE ||
      actor.role === UserRole.CLIENTE
    ) {
      throw new ForbiddenException('Solo empresa puede subir evidencias');
    }
    if (actor.role === UserRole.ULTIMO_PLANIFICADOR) return;
    if (actor.role === UserRole.ESPECIALISTA) {
      if (!actor.specialtyId?.equals(specialtyId)) {
        throw new ForbiddenException('No es tu especialidad');
      }
      return;
    }
    throw new ForbiddenException('Sin permiso');
  }
}
