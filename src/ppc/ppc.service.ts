import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { PlanningWeekService } from '../common/planning-week/planning-week.service';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';
import type { PpcSnapshotResponseDto } from './dto/ppc-snapshot-response.dto';
import { RegeneratePpcDto } from './dto/regenerate-ppc.dto';
import { PpcWeekly, PpcWeeklyDocument } from './schemas/ppc-weekly.schema';
import { WorkPackage, WorkPackageDocument } from '../work-packages/schemas/work-package.schema';

type ActivityRow = PpcSnapshotResponseDto['workPackages'][number]['activities'][number];
type WpLite = { name: string; order: number };

@Injectable()
export class PpcService {
  constructor(
    @InjectModel(PpcWeekly.name) private readonly ppcModel: Model<PpcWeeklyDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(WorkPackage.name) private readonly workPackageModel: Model<WorkPackageDocument>,
    private readonly planningWeekService: PlanningWeekService,
  ) {}

  async listWeeks(projectId: Types.ObjectId, specialtyId?: Types.ObjectId) {
    const match: Record<string, unknown> = { projectId };
    if (specialtyId) {
      match.specialtyId = specialtyId;
    }
    const dates = (await this.ppcModel.distinct('weekStart', match).exec()) as Date[];
    const tz = await this.planningWeekService.getProjectTimeZone(projectId);
    return dates
      .sort((a, b) => a.getTime() - b.getTime())
      .map((d) => DateTime.fromJSDate(d, { zone: 'utc' }).setZone(tz).toISODate()!);
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
    const resolution = await this.planningWeekService.resolveWeekForProject(projectId, dto.weekAnchor);
    const specialtyId = new Types.ObjectId(dto.specialtyId);
    const { weekStart, weekEnd } = resolution;

    const plannedFilter = {
      projectId,
      specialtyId,
      'planned.start': { $lte: weekEnd },
      'planned.end': { $gte: weekStart },
    };

    const activities = await this.activityModel.find(plannedFilter).lean().exec();

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

    return this.getSnapshot(projectId, specialtyId, dto.weekAnchor);
  }
}
