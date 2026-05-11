import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { Duty, DutyDocument } from '../duties/schemas/duty.schema';
import { Agreement, AgreementDocument } from '../meetings/schemas/agreement.schema';
import { PpcWeekly, PpcWeeklyDocument } from '../ppc/schemas/ppc-weekly.schema';
import { DutyStatus } from '../common/enums/duty-status.enum';
import { AgreementStatus } from '../common/enums/agreement-status.enum';
import { ActivityStatusColor } from '../common/enums/activity-color.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Duty.name) private readonly dutyModel: Model<DutyDocument>,
    @InjectModel(Agreement.name) private readonly agreementModel: Model<AgreementDocument>,
    @InjectModel(PpcWeekly.name) private readonly ppcModel: Model<PpcWeeklyDocument>,
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
    const filter: Record<string, unknown> = { projectId };
    if (specialtyId) filter.specialtyId = specialtyId;

    return this.ppcModel.find(filter).sort({ weekStart: 1 }).lean().exec();
  }

  async rankingFallas(projectId: Types.ObjectId, limit = 50) {
    return this.activityModel
      .aggregate([
        { $match: { projectId } },
        {
          $addFields: {
            affectedLen: { $size: { $ifNull: ['$nonCompliance.affectedWeeks', []] } },
            redBoost: { $cond: [{ $eq: ['$statusColor', ActivityStatusColor.RED] }, 5, 0] },
          },
        },
        {
          $addFields: {
            score: {
              $sum: [
                '$affectedLen',
                '$redBoost',
                { $cond: [{ $eq: ['$nonCompliance.isActive', true] }, 3, 0] },
              ],
            },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $project: {
            code: 1,
            description: 1,
            statusColor: 1,
            workPackageId: 1,
            specialtyId: 1,
            nonCompliance: 1,
            score: 1,
          },
        },
      ])
      .exec();
  }
}
