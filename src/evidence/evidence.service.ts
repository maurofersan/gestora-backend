import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryAssetService } from '../integrations/cloudinary/cloudinary-asset.service';
import { collectCloudinaryPublicIdsFromUrls } from '../integrations/cloudinary/extract-public-id.util';
import { ActivityEvidence, ActivityEvidenceDocument } from './schemas/activity-evidence.schema';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @InjectModel(ActivityEvidence.name)
    private readonly evidenceModel: Model<ActivityEvidenceDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    private readonly cloudinaryAssets: CloudinaryAssetService,
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
    this.assertEvidenceMutator(actor, activity.specialtyId);

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

  async remove(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    evidenceId: Types.ObjectId,
  ): Promise<void> {
    const activity = await this.ensureActivity(projectId, activityId);
    this.assertEvidenceMutator(actor, activity.specialtyId);

    const evidence = await this.evidenceModel
      .findOne({ _id: evidenceId, projectId, activityId })
      .exec();
    if (!evidence) {
      throw new NotFoundException('Evidencia no encontrada');
    }

    const publicIds = collectCloudinaryPublicIdsFromUrls(evidence.url, evidence.thumbUrl);
    if (publicIds.length === 0) {
      this.logger.warn(
        `Evidencia ${evidenceId.toString()}: URL no parseable como Cloudinary; solo se borra MongoDB`,
      );
    } else {
      const results = await this.cloudinaryAssets.destroyByPublicIds(publicIds);
      const failed = results.filter((r) => r.outcome === 'not_found');
      if (failed.length > 0) {
        this.logger.warn(
          `Evidencia ${evidenceId.toString()}: Cloudinary not found para public_id=${failed.map((r) => r.publicId).join(', ')}`,
        );
      }
    }

    await this.evidenceModel.deleteOne({ _id: evidence._id }).exec();
    await this.activityModel.updateOne(
      { _id: activityId, evidenceCount: { $gt: 0 } },
      { $inc: { evidenceCount: -1 } },
    );
  }

  private async ensureActivity(projectId: Types.ObjectId, activityId: Types.ObjectId) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId }).exec();
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  private assertEvidenceMutator(actor: AuthenticatedUser, specialtyId: Types.ObjectId) {
    if (
      actor.role === UserRole.GERENTE ||
      actor.role === UserRole.RESIDENTE ||
      actor.role === UserRole.CLIENTE
    ) {
      throw new ForbiddenException('Solo empresa puede gestionar evidencias');
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
