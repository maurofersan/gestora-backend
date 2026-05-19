import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Activity,
  ActivityDocument,
  ActualWindow,
  PlannedWindow,
} from './schemas/activity.schema';
import { WorkPackage, WorkPackageDocument } from '../work-packages/schemas/work-package.schema';
import { Sector, SectorDocument } from '../sectors/schemas/sector.schema';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { computeActivityStatusColor } from '../common/utils/activity-status.util';
import { addCalendarDays } from '../common/utils/date.util';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { AddRestrictionDto } from './dto/add-restriction.dto';
import { PatchNonComplianceDto } from './dto/patch-non-compliance.dto';
import { CreateNonComplianceEventDto } from './dto/create-non-compliance-event.dto';
import type { NonComplianceEvent } from './schemas/non-compliance-event.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(WorkPackage.name)
    private readonly workPackageModel: Model<WorkPackageDocument>,
    @InjectModel(Sector.name) private readonly sectorModel: Model<SectorDocument>,
  ) {}

  async list(projectId: Types.ObjectId, query: ListActivitiesQueryDto) {
    const filter: Record<string, unknown> = { projectId };
    if (query.sectorId) filter.sectorId = new Types.ObjectId(query.sectorId);
    if (query.workPackageId)
      filter.workPackageId = new Types.ObjectId(query.workPackageId);
    if (query.specialtyId) filter.specialtyId = new Types.ObjectId(query.specialtyId);
    if (query.weekStart && query.weekEnd) {
      filter['planned.start'] = { $lte: query.weekEnd };
      filter['planned.end'] = { $gte: query.weekStart };
    }
    return this.activityModel.find(filter).sort({ 'planned.start': 1 }).lean().exec();
  }

  async get(projectId: Types.ObjectId, activityId: Types.ObjectId) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId }).lean().exec();
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  async listNonComplianceEvents(projectId: Types.ObjectId, activityId: Types.ObjectId) {
    const activity = await this.get(projectId, activityId);
    const events = activity.nonComplianceEvents ?? [];
    return {
      activityId: activity._id,
      projectId: activity.projectId,
      code: activity.code,
      description: activity.description,
      nonComplianceCount: events.length,
      events: [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }

  async getNonComplianceEvent(
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    eventId: Types.ObjectId,
  ) {
    const activity = await this.get(projectId, activityId);
    const event = (activity.nonComplianceEvents ?? []).find(
      (e) => e._id?.toString() === eventId.toString(),
    );
    if (!event) throw new NotFoundException('Incumplimiento no encontrado');
    return {
      activityId: activity._id,
      projectId: activity.projectId,
      code: activity.code,
      description: activity.description,
      workPackageId: activity.workPackageId,
      specialtyId: activity.specialtyId,
      event,
    };
  }

  async createNonComplianceEvent(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    dto: CreateNonComplianceEventDto,
  ) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    this.forbidReadOnly(actor);
    this.assertSpecialistMatches(actor, activity.specialtyId);

    const event: NonComplianceEvent = {
      _id: new Types.ObjectId(),
      isActive: dto.isActive ?? true,
      causesText: dto.causesText ?? null,
      correctiveActionsText: dto.correctiveActionsText ?? null,
      affectedWeeks: dto.affectedWeeks ?? [],
      createdAt: new Date(),
      createdBy: actor._id,
    };

    if (!activity.nonComplianceEvents) {
      activity.nonComplianceEvents = [];
    }
    activity.nonComplianceEvents.push(event);
    activity.updatedBy = actor._id;
    await activity.save();
    return this.getNonComplianceEvent(projectId, activityId, event._id);
  }

  async patchNonComplianceEvent(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    eventId: Types.ObjectId,
    dto: PatchNonComplianceDto,
  ) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    this.forbidReadOnly(actor);
    this.assertSpecialistMatches(actor, activity.specialtyId);

    const event = activity.nonComplianceEvents?.find((e) => e._id.equals(eventId));
    if (!event) throw new NotFoundException('Incumplimiento no encontrado');

    if (dto.isActive !== undefined) event.isActive = dto.isActive;
    if (dto.causesText !== undefined) event.causesText = dto.causesText ?? null;
    if (dto.correctiveActionsText !== undefined) {
      event.correctiveActionsText = dto.correctiveActionsText ?? null;
    }
    if (dto.affectedWeeks !== undefined) event.affectedWeeks = dto.affectedWeeks;

    activity.updatedBy = actor._id;
    await activity.save();
    return this.getNonComplianceEvent(projectId, activityId, eventId);
  }

  /**
   * Compatibilidad con modales legacy: actualiza el incumplimiento activo más reciente
   * o crea uno nuevo si no hay activo.
   */
  async patchNonCompliance(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    dto: PatchNonComplianceDto,
  ) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    this.forbidReadOnly(actor);
    this.assertSpecialistMatches(actor, activity.specialtyId);

    if (!activity.nonComplianceEvents) {
      activity.nonComplianceEvents = [];
    }

    let event = [...activity.nonComplianceEvents]
      .filter((e) => e.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const hasPayload =
      dto.causesText !== undefined ||
      dto.correctiveActionsText !== undefined ||
      dto.affectedWeeks !== undefined ||
      dto.isActive !== undefined;

    if (!event && hasPayload) {
      event = {
        _id: new Types.ObjectId(),
        isActive: dto.isActive ?? true,
        causesText: dto.causesText ?? null,
        correctiveActionsText: dto.correctiveActionsText ?? null,
        affectedWeeks: dto.affectedWeeks ?? [],
        createdAt: new Date(),
        createdBy: actor._id,
      };
      activity.nonComplianceEvents.push(event);
    } else if (event) {
      if (dto.isActive !== undefined) event.isActive = dto.isActive;
      if (dto.causesText !== undefined) event.causesText = dto.causesText ?? null;
      if (dto.correctiveActionsText !== undefined) {
        event.correctiveActionsText = dto.correctiveActionsText ?? null;
      }
      if (dto.affectedWeeks !== undefined) event.affectedWeeks = dto.affectedWeeks;
    }

    activity.updatedBy = actor._id;
    await activity.save();
    return activity.toObject();
  }

  async create(actor: AuthenticatedUser, projectId: Types.ObjectId, dto: CreateActivityDto) {
    this.forbidReadOnly(actor);

    const wp = await this.workPackageModel.findOne({
      _id: dto.workPackageId,
      projectId,
    });
    if (!wp) throw new NotFoundException('Partida no encontrada');

    this.assertSpecialistMatches(actor, wp.specialtyId);

    const sector = await this.sectorModel.findOne({
      _id: dto.sectorId,
      projectId,
    });
    if (!sector) throw new NotFoundException('Sector no encontrado');

    const plannedStart = new Date(dto.plannedStart);
    const planned: PlannedWindow = {
      start: plannedStart,
      durationDays: dto.plannedDurationDays,
      end: addCalendarDays(plannedStart, dto.plannedDurationDays),
    };

    const actual: ActualWindow = {
      start: dto.actualStart ?? null,
      durationDays: dto.actualDurationDays ?? null,
      end: dto.actualEnd ?? null,
    };

    const workflow = ActivityWorkflowStatus.PENDING;
    const statusColor = computeActivityStatusColor(workflow, planned.end);

    const dup = await this.activityModel.exists({ projectId, code: dto.code });
    if (dup) throw new ForbiddenException('Código duplicado en el proyecto');

    const activity = await this.activityModel.create({
      projectId,
      workPackageId: wp._id,
      specialtyId: wp.specialtyId,
      sectorId: sector._id,
      code: dto.code,
      description: dto.description,
      planned,
      actual,
      status: workflow,
      statusColor,
      restrictions: [],
      nonComplianceEvents: [],
      evidenceCount: 0,
      updatedBy: actor._id,
    });

    return activity.toObject();
  }

  async update(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    dto: UpdateActivityDto,
  ) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    this.forbidReadOnly(actor);
    this.assertSpecialistMatches(actor, activity.specialtyId);

    if (dto.description !== undefined) activity.description = dto.description;

    if (dto.plannedStart !== undefined || dto.plannedDurationDays !== undefined) {
      const start = dto.plannedStart ? new Date(dto.plannedStart) : new Date(activity.planned.start);
      const dur =
        dto.plannedDurationDays !== undefined ? dto.plannedDurationDays : activity.planned.durationDays;
      activity.planned = {
        start,
        durationDays: dur,
        end: addCalendarDays(start, dur),
      };
    }

    if (dto.actualStart !== undefined) activity.actual.start = dto.actualStart ?? null;
    if (dto.actualDurationDays !== undefined)
      activity.actual.durationDays = dto.actualDurationDays ?? null;
    if (dto.actualEnd !== undefined) activity.actual.end = dto.actualEnd ?? null;

    if (dto.status !== undefined) activity.status = dto.status;

    activity.statusColor = computeActivityStatusColor(activity.status, activity.planned.end);
    activity.updatedBy = actor._id;
    await activity.save();
    return activity.toObject();
  }

  async addRestriction(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    activityId: Types.ObjectId,
    dto: AddRestrictionDto,
  ) {
    const activity = await this.activityModel.findOne({ _id: activityId, projectId });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    this.forbidReadOnly(actor);
    this.assertSpecialistMatches(actor, activity.specialtyId);

    activity.restrictions.push({
      text: dto.text,
      createdAt: new Date(),
      createdBy: actor._id,
    });
    activity.updatedBy = actor._id;
    await activity.save();
    return activity.toObject();
  }

  private forbidReadOnly(actor: AuthenticatedUser) {
    if (
      actor.role === UserRole.GERENTE ||
      actor.role === UserRole.RESIDENTE ||
      actor.role === UserRole.CLIENTE
    ) {
      throw new ForbiddenException('Solo lectura');
    }
    if (actor.role !== UserRole.ULTIMO_PLANIFICADOR && actor.role !== UserRole.ESPECIALISTA) {
      throw new ForbiddenException('Sin permiso');
    }
  }

  private assertSpecialistMatches(actor: AuthenticatedUser, specialtyId: Types.ObjectId) {
    if (actor.role !== UserRole.ESPECIALISTA) return;
    if (!actor.specialtyId?.equals(specialtyId)) {
      throw new ForbiddenException('No es tu especialidad');
    }
  }
}
