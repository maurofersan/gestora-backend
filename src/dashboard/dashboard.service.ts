import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Duty, DutyDocument } from '../duties/schemas/duty.schema';
import { Agreement, AgreementDocument } from '../meetings/schemas/agreement.schema';
import { PpcWeekly, PpcWeeklyDocument } from '../ppc/schemas/ppc-weekly.schema';
import { DutyStatus } from '../common/enums/duty-status.enum';
import { AgreementStatus } from '../common/enums/agreement-status.enum';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';
import { PlanningWeekService } from '../common/planning-week/planning-week.service';
import { mondayOfInstantInProjectZone } from '../common/planning-week/resolve-planning-week';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Duty.name) private readonly dutyModel: Model<DutyDocument>,
    @InjectModel(Agreement.name) private readonly agreementModel: Model<AgreementDocument>,
    @InjectModel(PpcWeekly.name) private readonly ppcModel: Model<PpcWeeklyDocument>,
    private readonly planningWeekService: PlanningWeekService,
  ) {}

  async summary(projectId: Types.ObjectId) {
    const pid = projectId;
    const byColor = await this.activityModel
      .aggregate<{ _id: ActivityStatusColor; count: number }>([
        { $match: { projectId: pid } },
        { $group: { _id: '$statusColor', count: { $sum: 1 } } },
      ])
      .exec();

    const dutyPending = await this.dutyModel.countDocuments({
      projectId: pid,
      status: DutyStatus.PENDING,
    });

    const agreementsPending = await this.agreementModel.countDocuments({
      projectId: pid,
      status: AgreementStatus.PENDING,
    });

    const totalActivities = await this.activityModel.countDocuments({ projectId: pid });
    const completedActivities = await this.activityModel.countDocuments({
      projectId: pid,
      statusColor: ActivityStatusColor.GREEN,
    });

    const completionPercent =
      totalActivities === 0
        ? 0
        : Math.round((completedActivities / totalActivities) * 10000) / 100;

    return {
      activityCountsByColor: Object.fromEntries(byColor.map((x) => [x._id, x.count])) as Record<
        string,
        number
      >,
      totalActivities,
      completedActivities,
      completionPercent,
      dutiesPending: dutyPending,
      agreementsPending,
    };
  }

  async progressChart(projectId: Types.ObjectId, specialtyId?: Types.ObjectId) {
    const filter: Record<string, unknown> = {
      projectId,
      plannedTotal: { $gt: 0 },
    };
    if (specialtyId) filter.specialtyId = specialtyId;

    const activityFilter: Record<string, unknown> = { projectId };
    if (specialtyId) activityFilter.specialtyId = specialtyId;

    const [tz, bounds] = await Promise.all([
      this.planningWeekService.getProjectTimeZone(projectId),
      this.activityModel
        .aggregate<{ minStart: Date; maxEnd: Date }>([
          { $match: activityFilter },
          {
            $group: {
              _id: null,
              minStart: { $min: '$planned.start' },
              maxEnd: { $max: '$planned.end' },
            },
          },
        ])
        .exec(),
    ]);

    const docs = await this.ppcModel.find(filter).sort({ weekStart: 1 }).lean().exec();

    const row = bounds[0];
    if (!row) {
      return [];
    }

    const horizonStart = mondayOfInstantInProjectZone(row.minStart, tz).toJSDate();
    const horizonEnd = mondayOfInstantInProjectZone(row.maxEnd, tz).toJSDate();

    return docs.filter(
      (doc) =>
        doc.weekStart.getTime() >= horizonStart.getTime() &&
        doc.weekStart.getTime() <= horizonEnd.getTime(),
    );
  }

  async rankingFallas(projectId: Types.ObjectId, limit = 50) {
    return this.activityModel
      .aggregate([
        { $match: { projectId } },
        {
          $addFields: {
            nonComplianceCount: { $size: { $ifNull: ['$nonComplianceEvents', []] } },
            isRed: { $eq: ['$statusColor', ActivityStatusColor.RED] },
          },
        },
        { $match: { nonComplianceCount: { $gt: 0 } } },
        { $sort: { nonComplianceCount: -1, isRed: -1, code: 1 } },
        { $limit: limit },
        {
          $project: {
            code: 1,
            description: 1,
            statusColor: 1,
            workPackageId: 1,
            specialtyId: 1,
            nonComplianceCount: 1,
            nonComplianceEvents: 1,
          },
        },
      ])
      .exec();
  }
}
