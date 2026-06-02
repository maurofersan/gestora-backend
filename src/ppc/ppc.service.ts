import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { PlanningWeekService } from '../common/planning-week/planning-week.service';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';
import {
  mondayOfInstantInProjectZone,
  resolvePlanningWeekFromAnchor,
  weekAnchorsForPlannedWindow,
} from '../common/planning-week/resolve-planning-week';
import type { PpcSnapshotResponseDto } from './dto/ppc-snapshot-response.dto';
import { RegeneratePpcDto } from './dto/regenerate-ppc.dto';
import { PpcWeekly, PpcWeeklyDocument } from './schemas/ppc-weekly.schema';
import { WorkPackage, WorkPackageDocument } from '../work-packages/schemas/work-package.schema';
import type { ProgressChartResponseDto } from '../dashboard/dto/progress-chart-response.dto';

type ActivityRow = PpcSnapshotResponseDto['workPackages'][number]['activities'][number];
type WpLite = { name: string; order: number };

export interface PpcProjectRegenerationResult {
  specialtiesProcessed: number;
  weeksUpserted: number;
  weeksRemoved: number;
}

@Injectable()
export class PpcService {
  constructor(
    @InjectModel(PpcWeekly.name) private readonly ppcModel: Model<PpcWeeklyDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(WorkPackage.name) private readonly workPackageModel: Model<WorkPackageDocument>,
    private readonly planningWeekService: PlanningWeekService,
  ) {}

  async listWeeks(projectId: Types.ObjectId, specialtyId?: Types.ObjectId) {
    const match: Record<string, unknown> = { projectId, plannedTotal: { $gt: 0 } };
    if (specialtyId) {
      match.specialtyId = specialtyId;
    }
    const dates = (await this.ppcModel.distinct('weekStart', match).exec()) as Date[];
    const tz = await this.planningWeekService.getProjectTimeZone(projectId);
    return dates
      .sort((a, b) => a.getTime() - b.getTime())
      .map((d) => DateTime.fromJSDate(d, { zone: tz }).toISODate()!);
  }

  async getSnapshot(
    projectId: Types.ObjectId,
    specialtyId: Types.ObjectId,
    weekAnchor: string,
  ): Promise<PpcSnapshotResponseDto> {
    const resolution = await this.planningWeekService.resolveWeekForProject(projectId, weekAnchor);
    const ppcDoc = await this.ppcModel
      .findOne({ projectId, specialtyId, weekStart: resolution.weekStart })
      .lean()
      .exec();

    const meta: PpcSnapshotResponseDto['meta'] = {
      projectTimeZone: resolution.projectTimeZone,
      weekAnchorRequested: weekAnchor.trim(),
      weekStartMonday: resolution.weekStartMonday,
      weekStartUtc: resolution.weekStart.toISOString(),
      weekEndUtc: resolution.weekEnd.toISOString(),
      weekLabel: resolution.weekLabel,
      projectId: projectId.toString(),
      specialtyId: specialtyId.toString(),
    };

    if (!ppcDoc) {
      return { meta, summary: null, workPackages: [] };
    }

    const activityIds = ppcDoc.items.map((i) => i.activityId);
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .lean()
      .exec();
    const activityById = new Map(activities.map((a) => [a._id.toString(), a]));

    const wpIds = [...new Set(ppcDoc.items.map((i) => i.workPackageId.toString()))];
    const workPackages = await this.workPackageModel
      .find({ _id: { $in: wpIds.map((id) => new Types.ObjectId(id)) } })
      .lean()
      .exec();
    const wpById = new Map(workPackages.map((w) => [w._id.toString(), w]));

    const groupMap = new Map<string, { wp: WpLite; rows: ActivityRow[] }>();

    for (const item of ppcDoc.items) {
      const wpIdStr = item.workPackageId.toString();
      const wp = wpById.get(wpIdStr);
      if (!groupMap.has(wpIdStr)) {
        groupMap.set(wpIdStr, {
          wp: wp
            ? { name: wp.name, order: wp.order ?? 0 }
            : { name: 'Partida desconocida', order: 999_999 },
          rows: [],
        });
      }
      const act = activityById.get(item.activityId.toString());
      const row: ActivityRow = {
        activityId: item.activityId.toString(),
        code: act?.code ?? item.activityCode,
        description: act?.description ?? '(sin actividad en catálogo)',
        status: act?.status ?? ActivityWorkflowStatus.PENDING,
        statusColor: act?.statusColor ?? ActivityStatusColor.YELLOW,
        wasPlanned: item.wasPlanned,
        wasCompleted: item.wasCompleted,
      };
      groupMap.get(wpIdStr)!.rows.push(row);
    }

    const workPackagesOut = [...groupMap.entries()]
      .map(([workPackageId, g]) => ({
        workPackageId,
        name: g.wp.name,
        order: g.wp.order,
        activities: g.rows.sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    const summary: PpcSnapshotResponseDto['summary'] = {
      plannedTotal: ppcDoc.plannedTotal,
      completedTotal: ppcDoc.completedTotal,
      ppcPercent: ppcDoc.ppcPercent,
      generatedAt: ppcDoc.generatedAt ? new Date(ppcDoc.generatedAt as Date).toISOString() : null,
    };

    return { meta, summary, workPackages: workPackagesOut };
  }

  async regenerate(projectId: Types.ObjectId, dto: RegeneratePpcDto) {
    await this.upsertWeekSnapshot(
      projectId,
      new Types.ObjectId(dto.specialtyId),
      dto.weekAnchor,
    );
    return this.getSnapshot(projectId, new Types.ObjectId(dto.specialtyId), dto.weekAnchor);
  }

  /**
   * Serie PPC semanal para el gráfico de avance — calculada en vivo desde activities
   * (no snapshots), una fila por lunes con actividades planificadas.
   */
  async computeProgressChartSeries(
    projectId: Types.ObjectId,
    specialtyId?: Types.ObjectId,
  ): Promise<ProgressChartResponseDto> {
    const tz = await this.planningWeekService.getProjectTimeZone(projectId);
    const currentWeekAnchor = mondayOfInstantInProjectZone(
      DateTime.now().setZone(tz).toJSDate(),
      tz,
    ).toISODate()!;
    const currentWeekResolution = resolvePlanningWeekFromAnchor(currentWeekAnchor, tz);

    const activityFilter: Record<string, unknown> = { projectId };
    if (specialtyId) activityFilter.specialtyId = specialtyId;

    const activities = await this.activityModel
      .find(activityFilter)
      .select('planned.start planned.end status')
      .lean()
      .exec();

    const weekStats = new Map<string, { plannedTotal: number; completedTotal: number }>();

    for (const activity of activities) {
      for (const anchor of weekAnchorsForPlannedWindow(
        activity.planned.start,
        activity.planned.end,
        tz,
      )) {
        const bucket = weekStats.get(anchor) ?? { plannedTotal: 0, completedTotal: 0 };
        bucket.plannedTotal += 1;
        if (activity.status === ActivityWorkflowStatus.DONE) {
          bucket.completedTotal += 1;
        }
        weekStats.set(anchor, bucket);
      }
    }

    const allPoints = [...weekStats.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([anchor, stats]) => {
        const resolution = resolvePlanningWeekFromAnchor(anchor, tz);
        const ppcPercent =
          stats.plannedTotal === 0
            ? 0
            : Math.round((stats.completedTotal / stats.plannedTotal) * 10000) / 100;
        return {
          weekStartMonday: resolution.weekStartMonday,
          weekLabel: resolution.weekLabel,
          weekStart: resolution.weekStart.toISOString(),
          weekEnd: resolution.weekEnd.toISOString(),
          plannedTotal: stats.plannedTotal,
          completedTotal: stats.completedTotal,
          ppcPercent,
          isCurrentWeek: anchor === currentWeekAnchor,
        };
      });

    /** Avance gráfico: solo semanas pasadas + semana calendario actual (sin futuro del plan). */
    const points = allPoints.filter((p) => p.weekStartMonday <= currentWeekAnchor);

    const currentPoint = points.find((p) => p.isCurrentWeek);
    const previousPoint =
      currentPoint && points.length > 1
        ? points[points.indexOf(currentPoint) - 1]
        : undefined;

    return {
      meta: {
        projectTimeZone: tz,
        currentWeekAnchor,
        currentWeekLabel: currentWeekResolution.weekLabel,
        currentWeekPpcPercent: currentPoint?.ppcPercent ?? null,
        currentWeekPlannedTotal: currentPoint?.plannedTotal ?? 0,
        currentWeekCompletedTotal: currentPoint?.completedTotal ?? 0,
        previousWeekPpcPercent: previousPoint?.ppcPercent ?? null,
        previousWeekLabel: previousPoint?.weekLabel ?? null,
        horizonStartMonday: points[0]?.weekStartMonday ?? null,
        horizonEndMonday: points[points.length - 1]?.weekStartMonday ?? null,
        seriesVersion: 2,
        ...(specialtyId ? { specialtyId: specialtyId.toString() } : {}),
      },
      points,
    };
  }

  /**
   * Recalcula snapshots PPC solo para semanas donde hay actividades planificadas.
   * Elimina snapshots huérfanos (p. ej. pruebas en 2027–2028).
   */
  async regenerateProjectFromActivities(
    projectId: Types.ObjectId,
  ): Promise<PpcProjectRegenerationResult> {
    const tz = await this.planningWeekService.getProjectTimeZone(projectId);
    const specialtyIds = (await this.activityModel
      .distinct('specialtyId', { projectId })
      .exec()) as Types.ObjectId[];

    let weeksUpserted = 0;
    let weeksRemoved = 0;
    const keptSnapshotKeys = new Set<string>();

    for (const specialtyId of specialtyIds) {
      const activities = await this.activityModel
        .find({ projectId, specialtyId })
        .select('planned.start planned.end')
        .lean()
        .exec();

      const weekAnchors = new Set<string>();
      for (const activity of activities) {
        for (const anchor of weekAnchorsForPlannedWindow(
          activity.planned.start,
          activity.planned.end,
          tz,
        )) {
          weekAnchors.add(anchor);
        }
      }

      for (const weekAnchor of [...weekAnchors].sort()) {
        const { weekStart, plannedTotal } = await this.upsertWeekSnapshot(
          projectId,
          specialtyId,
          weekAnchor,
        );

        if (plannedTotal > 0) {
          keptSnapshotKeys.add(this.snapshotKey(specialtyId, weekStart));
          weeksUpserted += 1;
        } else {
          const removed = await this.ppcModel.deleteOne({
            projectId,
            specialtyId,
            weekStart,
          });
          if (removed.deletedCount > 0) weeksRemoved += 1;
        }
      }
    }

    const existing = await this.ppcModel
      .find({ projectId })
      .select('specialtyId weekStart')
      .lean()
      .exec();

    const orphanIds = existing
      .filter((doc) => !keptSnapshotKeys.has(this.snapshotKey(doc.specialtyId, doc.weekStart)))
      .map((doc) => doc._id);

    if (orphanIds.length > 0) {
      const orphanResult = await this.ppcModel.deleteMany({ _id: { $in: orphanIds } });
      weeksRemoved += orphanResult.deletedCount ?? 0;
    }

    return {
      specialtiesProcessed: specialtyIds.length,
      weeksUpserted,
      weeksRemoved,
    };
  }

  private snapshotKey(specialtyId: Types.ObjectId, weekStart: Date): string {
    return `${specialtyId.toString()}|${weekStart.getTime()}`;
  }

  private async upsertWeekSnapshot(
    projectId: Types.ObjectId,
    specialtyId: Types.ObjectId,
    weekAnchor: string,
  ): Promise<{ weekStart: Date; plannedTotal: number }> {
    const resolution = await this.planningWeekService.resolveWeekForProject(projectId, weekAnchor);
    const { weekStart, weekEnd } = resolution;

    const activities = await this.activityModel
      .find({
        projectId,
        specialtyId,
        'planned.start': { $lte: weekEnd },
        'planned.end': { $gte: weekStart },
      })
      .lean()
      .exec();

    const items = activities.map((a) => ({
      activityId: a._id,
      workPackageId: a.workPackageId,
      activityCode: a.code,
      wasPlanned: true,
      wasCompleted: a.status === ActivityWorkflowStatus.DONE,
    }));

    const plannedTotal = items.length;
    const completedTotal = items.filter((i) => i.wasCompleted).length;
    const ppcPercent =
      plannedTotal === 0 ? 0 : Math.round((completedTotal / plannedTotal) * 10000) / 100;

    if (plannedTotal > 0) {
      await this.ppcModel.findOneAndUpdate(
        { projectId, specialtyId, weekStart },
        {
          projectId,
          specialtyId,
          weekStart,
          weekEnd,
          weekLabel: resolution.weekLabel,
          plannedTotal,
          completedTotal,
          ppcPercent,
          items,
          generatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return { weekStart, plannedTotal };
  }
}
