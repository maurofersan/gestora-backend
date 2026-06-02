import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { computeActivityStatusColor } from '../common/utils/activity-status.util';
import { addCalendarDays } from '../common/utils/date.util';
import {
  Activity,
  ActivityDocument,
  PlannedWindow,
} from '../activities/schemas/activity.schema';
import { Sector, SectorDocument } from '../sectors/schemas/sector.schema';
import {
  WorkPackage,
  WorkPackageDocument,
} from '../work-packages/schemas/work-package.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  Specialty,
  SpecialtyDocument,
} from '../specialties/schemas/specialty.schema';
import {
  ScheduleUpload,
  ScheduleUploadDocument,
} from '../schedule-uploads/schemas/schedule-upload.schema';
import { parseScheduleExcel } from './parsers/schedule-excel.parser';
import { ScheduleImportOptionsDto } from './dto/schedule-import-options.dto';
import type {
  ScheduleImportErrorDetail,
  ScheduleImportPreviewResult,
  ScheduleImportPreviewRow,
  ScheduleImportPreviewRowData,
  ScheduleImportPreviewSummary,
  ScheduleImportResult,
  ScheduleImportRowInput,
  ScheduleImportRowResolution,
  ScheduleImportStats,
} from './types/schedule-import-row.types';
import { SCHEDULE_IMPORT_COLUMNS } from './schedule-import.constants';

interface MasterDataCache {
  projectId: Types.ObjectId;
  companyId: Types.ObjectId;
  sectorsByKey: Map<string, SectorDocument>;
  workPackagesByKey: Map<string, WorkPackageDocument>;
  specialtiesByKey: Map<string, SpecialtyDocument>;
  activitiesByCode: Map<string, ActivityDocument>;
  nextSectorOrder: number;
  nextWorkPackageOrder: number;
}

@Injectable()
export class ScheduleImportsService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Sector.name) private readonly sectorModel: Model<SectorDocument>,
    @InjectModel(WorkPackage.name)
    private readonly workPackageModel: Model<WorkPackageDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Specialty.name)
    private readonly specialtyModel: Model<SpecialtyDocument>,
    @InjectModel(ScheduleUpload.name)
    private readonly scheduleUploadModel: Model<ScheduleUploadDocument>,
  ) {}

  async preview(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    file: Express.Multer.File,
  ): Promise<ScheduleImportPreviewResult> {
    this.assertPlanificador(actor);
    const cache = await this.loadMasterData(projectId);
    const parsed = parseScheduleExcel(file.buffer);

    if (parsed.columnsMissing.length > 0) {
      throw new BadRequestException({
        message: 'Faltan columnas obligatorias en la fila 1',
        columnsExpected: [...SCHEDULE_IMPORT_COLUMNS],
        columnsFound: parsed.columnsFound,
        columnsMissing: parsed.columnsMissing,
        unknownHeaders: parsed.unknownHeaders,
      });
    }

    const sectorsToCreate = new Set<string>();
    const workPackagesToCreate = new Set<string>();
    let wouldCreateActivities = 0;
    let wouldUpdateActivities = 0;
    let invalidRows = 0;

    const rows: ScheduleImportPreviewRow[] = parsed.rows.map((row) => {
      if (!row.input) {
        invalidRows += 1;
        return {
          rowNumber: row.rowNumber,
          valid: false,
          errors: row.errors,
          data: null,
          resolution: null,
          action: null,
        };
      }

      const resolution = this.resolveRow(row.input, cache);
      const rowErrors = [
        ...row.errors,
        ...this.resolutionErrors(row.input, resolution, cache, true, true),
      ];

      if (rowErrors.length > 0) {
        invalidRows += 1;
        return {
          rowNumber: row.rowNumber,
          valid: false,
          errors: rowErrors.map((e) => (typeof e === 'string' ? { message: e } : e)),
          data: this.serializeRowInput(row.input),
          resolution,
          action: null,
        };
      }

      if (!resolution.sectorExists) {
        sectorsToCreate.add(normalizeKey(row.input.sectorNombre));
      }
      if (!resolution.workPackageExists) {
        workPackagesToCreate.add(
          `${normalizeKey(row.input.partidaNombre)}|${normalizeKey(row.input.especialidadNombre)}`,
        );
      }

      if (resolution.activityExists) {
        wouldUpdateActivities += 1;
      } else {
        wouldCreateActivities += 1;
      }

      const action = resolution.activityExists ? 'update' : 'create';
      return {
        rowNumber: row.rowNumber,
        valid: true,
        errors: [],
        data: this.serializeRowInput(row.input),
        resolution,
        action,
      };
    });

    const summary: ScheduleImportPreviewSummary = {
      wouldCreateActivities,
      wouldUpdateActivities,
      wouldSkipActivities: 0,
      wouldCreateSectors: sectorsToCreate.size,
      wouldCreateWorkPackages: workPackagesToCreate.size,
      invalidRows,
    };

    return {
      columnsFound: parsed.columnsFound,
      columnsMissing: parsed.columnsMissing,
      totalRows: parsed.rows.length,
      validRows: rows.filter((r) => r.valid).length,
      rows,
      summary,
    };
  }

  async import(
    actor: AuthenticatedUser,
    projectId: Types.ObjectId,
    file: Express.Multer.File,
    options: ScheduleImportOptionsDto,
  ): Promise<ScheduleImportResult> {
    this.assertPlanificador(actor);

    const createMissingSectors = options.createMissingSectors ?? true;
    const createMissingWorkPackages = options.createMissingWorkPackages ?? true;

    const cache = await this.loadMasterData(projectId);
    const parsed = parseScheduleExcel(file.buffer);

    if (parsed.columnsMissing.length > 0) {
      throw new BadRequestException({
        message: 'Faltan columnas obligatorias en la fila 1',
        columnsExpected: [...SCHEDULE_IMPORT_COLUMNS],
        columnsFound: parsed.columnsFound,
        columnsMissing: parsed.columnsMissing,
      });
    }

    const stats: ScheduleImportStats = {
      activitiesCreated: 0,
      activitiesUpdated: 0,
      activitiesSkipped: 0,
      sectorsCreated: 0,
      workPackagesCreated: 0,
      errors: 0,
    };
    const errors: ScheduleImportErrorDetail[] = [];

    for (const row of parsed.rows) {
      if (!row.input) {
        stats.errors += 1;
        errors.push({
          rowNumber: row.rowNumber,
          message: row.errors.map((e) => e.message).join('; ') || 'Fila inválida',
        });
        continue;
      }

      try {
        const resolution = this.resolveRow(row.input, cache);
        const rowErrors = this.resolutionErrors(
          row.input,
          resolution,
          cache,
          createMissingSectors,
          createMissingWorkPackages,
        );
        if (rowErrors.length > 0) {
          stats.errors += 1;
          errors.push({
            rowNumber: row.rowNumber,
            message: rowErrors.map((e) => (typeof e === 'string' ? e : e.message)).join('; '),
          });
          continue;
        }

        const sector = await this.ensureSector(
          row.input,
          cache,
          createMissingSectors,
          stats,
        );
        const workPackage = await this.ensureWorkPackage(
          row.input,
          cache,
          createMissingWorkPackages,
          stats,
        );

        const planned = this.buildPlanned(row.input);
        const existing = cache.activitiesByCode.get(normalizeKey(row.input.codigo));

        if (existing) {
          const updated = await this.updateExistingActivity(
            existing,
            row.input,
            planned,
            sector._id,
            workPackage._id,
            workPackage.specialtyId,
            actor._id,
          );
          cache.activitiesByCode.set(normalizeKey(updated.code), updated);
          stats.activitiesUpdated += 1;
        } else {
          const created = await this.createActivity(
            projectId,
            row.input,
            planned,
            sector._id,
            workPackage._id,
            workPackage.specialtyId,
            actor._id,
          );
          cache.activitiesByCode.set(normalizeKey(created.code), created);
          stats.activitiesCreated += 1;
        }
      } catch (err) {
        stats.errors += 1;
        errors.push({
          rowNumber: row.rowNumber,
          message: err instanceof Error ? err.message : 'Error al importar fila',
        });
      }
    }

    let scheduleUploadId: string | null = null;
    if (options.scheduleUploadId) {
      const upload = await this.scheduleUploadModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(options.scheduleUploadId),
          projectId,
        },
        {
          parsedStatus: stats.errors > 0 && stats.activitiesCreated + stats.activitiesUpdated === 0
            ? 'failed'
            : 'parsed',
          stats: {
            activitiesCreated: stats.activitiesCreated,
            activitiesUpdated: stats.activitiesUpdated,
            errors: stats.errors,
          },
        },
        { new: true },
      );
      if (!upload) throw new NotFoundException('Registro de cronograma no encontrado');
      scheduleUploadId = upload._id.toString();
    }

    return { scheduleUploadId, stats, errors };
  }

  private async loadMasterData(projectId: Types.ObjectId): Promise<MasterDataCache> {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const [sectors, workPackages, specialties, activities] = await Promise.all([
      this.sectorModel.find({ projectId }).exec(),
      this.workPackageModel.find({ projectId }).exec(),
      this.specialtyModel.find({ companyId: project.companyId, status: 'active' }).exec(),
      this.activityModel.find({ projectId }).exec(),
    ]);

    const sectorsByKey = new Map<string, SectorDocument>();
    let nextSectorOrder = 0;
    for (const s of sectors) {
      sectorsByKey.set(normalizeKey(s.name), s);
      nextSectorOrder = Math.max(nextSectorOrder, s.order ?? 0);
    }

    const workPackagesByKey = new Map<string, WorkPackageDocument>();
    let nextWorkPackageOrder = 0;
    for (const wp of workPackages) {
      workPackagesByKey.set(normalizeKey(wp.name), wp);
      nextWorkPackageOrder = Math.max(nextWorkPackageOrder, wp.order ?? 0);
    }

    const specialtiesByKey = new Map<string, SpecialtyDocument>();
    for (const sp of specialties) {
      specialtiesByKey.set(normalizeKey(sp.name), sp);
    }

    const activitiesByCode = new Map<string, ActivityDocument>();
    for (const a of activities) {
      activitiesByCode.set(normalizeKey(a.code), a);
    }

    return {
      projectId,
      companyId: project.companyId,
      sectorsByKey,
      workPackagesByKey,
      specialtiesByKey,
      activitiesByCode,
      nextSectorOrder,
      nextWorkPackageOrder,
    };
  }

  private resolveRow(
    input: ScheduleImportRowInput,
    cache: MasterDataCache,
  ): ScheduleImportRowResolution {
    const sector = cache.sectorsByKey.get(normalizeKey(input.sectorNombre));
    const workPackage = cache.workPackagesByKey.get(normalizeKey(input.partidaNombre));
    const specialty = cache.specialtiesByKey.get(normalizeKey(input.especialidadNombre));
    const activity = cache.activitiesByCode.get(normalizeKey(input.codigo));

    const workPackageSpecialtyMismatch =
      !!workPackage &&
      !!specialty &&
      !workPackage.specialtyId.equals(specialty._id);

    return {
      sectorExists: !!sector,
      workPackageExists: !!workPackage,
      specialtyExists: !!specialty,
      activityExists: !!activity,
      workPackageSpecialtyMismatch,
    };
  }

  private resolutionErrors(
    input: ScheduleImportRowInput,
    resolution: ScheduleImportRowResolution,
    cache: MasterDataCache,
    createMissingSectors: boolean,
    createMissingWorkPackages: boolean,
  ): Array<string | { field?: string; message: string }> {
    const errors: Array<string | { field?: string; message: string }> = [];

    if (!resolution.specialtyExists) {
      errors.push({
        field: 'especialidad_nombre',
        message: `Especialidad no encontrada: ${input.especialidadNombre}`,
      });
    }

    if (resolution.workPackageSpecialtyMismatch) {
      errors.push({
        field: 'especialidad_nombre',
        message: `La partida "${input.partidaNombre}" ya existe con otra especialidad`,
      });
    }

    if (!resolution.sectorExists && !createMissingSectors) {
      errors.push({
        field: 'sector_nombre',
        message: `Sector no encontrado: ${input.sectorNombre}`,
      });
    }

    if (!resolution.workPackageExists && !createMissingWorkPackages) {
      errors.push({
        field: 'partida_nombre',
        message: `Partida no encontrada: ${input.partidaNombre}`,
      });
    }

    return errors;
  }

  private async ensureSector(
    input: ScheduleImportRowInput,
    cache: MasterDataCache,
    createMissing: boolean,
    stats: ScheduleImportStats,
  ): Promise<SectorDocument> {
    const key = normalizeKey(input.sectorNombre);
    const existing = cache.sectorsByKey.get(key);
    if (existing) return existing;

    if (!createMissing) {
      throw new BadRequestException(`Sector no encontrado: ${input.sectorNombre}`);
    }

    cache.nextSectorOrder += 1;
    const sector = await this.sectorModel.create({
      projectId: cache.projectId,
      name: input.sectorNombre.trim(),
      order: cache.nextSectorOrder,
    });
    cache.sectorsByKey.set(key, sector);
    stats.sectorsCreated += 1;
    return sector;
  }

  private async ensureWorkPackage(
    input: ScheduleImportRowInput,
    cache: MasterDataCache,
    createMissing: boolean,
    stats: ScheduleImportStats,
  ): Promise<WorkPackageDocument> {
    const key = normalizeKey(input.partidaNombre);
    const existing = cache.workPackagesByKey.get(key);
    if (existing) return existing;

    if (!createMissing) {
      throw new BadRequestException(`Partida no encontrada: ${input.partidaNombre}`);
    }

    const specialty = cache.specialtiesByKey.get(normalizeKey(input.especialidadNombre));
    if (!specialty) {
      throw new BadRequestException(`Especialidad no encontrada: ${input.especialidadNombre}`);
    }

    cache.nextWorkPackageOrder += 1;
    const workPackage = await this.workPackageModel.create({
      projectId: cache.projectId,
      name: input.partidaNombre.trim(),
      specialtyId: specialty._id,
      order: cache.nextWorkPackageOrder,
    });
    cache.workPackagesByKey.set(key, workPackage);
    stats.workPackagesCreated += 1;
    return workPackage;
  }

  private buildPlanned(input: ScheduleImportRowInput): PlannedWindow {
    const start = input.fechaInicio;
    return {
      start,
      durationDays: input.duracionDias,
      end: addCalendarDays(start, input.duracionDias),
    };
  }

  private async createActivity(
    projectId: Types.ObjectId,
    input: ScheduleImportRowInput,
    planned: PlannedWindow,
    sectorId: Types.ObjectId,
    workPackageId: Types.ObjectId,
    specialtyId: Types.ObjectId,
    actorId: Types.ObjectId,
  ): Promise<ActivityDocument> {
    const workflow = ActivityWorkflowStatus.PENDING;
    const statusColor = computeActivityStatusColor(workflow, planned.end);

    return this.activityModel.create({
      projectId,
      workPackageId,
      specialtyId,
      sectorId,
      code: input.codigo,
      description: input.descripcion,
      planned,
      actual: { start: null, durationDays: null, end: null },
      status: workflow,
      statusColor,
      restrictions: [],
      nonComplianceEvents: [],
      evidenceCount: 0,
      updatedBy: actorId,
    });
  }

  private async updateExistingActivity(
    activity: ActivityDocument,
    input: ScheduleImportRowInput,
    planned: PlannedWindow,
    sectorId: Types.ObjectId,
    workPackageId: Types.ObjectId,
    specialtyId: Types.ObjectId,
    actorId: Types.ObjectId,
  ): Promise<ActivityDocument> {
    activity.description = input.descripcion;
    activity.planned = planned;
    activity.sectorId = sectorId;
    activity.workPackageId = workPackageId;
    activity.specialtyId = specialtyId;
    activity.statusColor = computeActivityStatusColor(activity.status, planned.end);
    activity.updatedBy = actorId;
    await activity.save();
    return activity;
  }

  private serializeRowInput(input: ScheduleImportRowInput): ScheduleImportPreviewRowData {
    return {
      codigo: input.codigo,
      descripcion: input.descripcion,
      partidaNombre: input.partidaNombre,
      sectorNombre: input.sectorNombre,
      especialidadNombre: input.especialidadNombre,
      fechaInicio: input.fechaInicio.toISOString().slice(0, 10),
      duracionDias: input.duracionDias,
    };
  }

  private assertPlanificador(actor: AuthenticatedUser) {
    if (actor.role !== UserRole.ULTIMO_PLANIFICADOR) {
      throw new ForbiddenException('Solo el último planificador puede importar cronograma');
    }
    if (!actor.companyId) {
      throw new ForbiddenException('Sin empresa');
    }
  }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}
