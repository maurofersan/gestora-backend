import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PpcWeekly, PpcWeeklyDocument } from './schemas/ppc-weekly.schema';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { ActivityWorkflowStatus } from '../common/enums/activity-workflow.enum';
import { getWeekRangeMondaySunday } from '../common/utils/week-range.util';
import { RegeneratePpcDto } from './dto/regenerate-ppc.dto';

@Injectable()
export class PpcService {
  constructor(
    @InjectModel(PpcWeekly.name) private readonly ppcModel: Model<PpcWeeklyDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async listWeeks(projectId: Types.ObjectId, specialtyId?: Types.ObjectId) {
    const match: Record<string, unknown> = { projectId };
    if (specialtyId) match.specialtyId = specialtyId;
    return this.ppcModel.distinct('weekStart', match).exec();
  }

  async getSnapshot(
    projectId: Types.ObjectId,
    specialtyId: Types.ObjectId,
    weekStart: Date,
  ) {
    const doc = await this.ppcModel
      .findOne({ projectId, specialtyId, weekStart })
      .lean()
      .exec();
    return doc;
  }

  async regenerate(projectId: Types.ObjectId, dto: RegeneratePpcDto) {
    const specialtyId = new Types.ObjectId(dto.specialtyId);
    const { weekStart, weekEnd } = getWeekRangeMondaySunday(new Date(dto.weekAnchor));

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

    const weekLabel = `${weekStart.toISOString().slice(0, 10)}–${weekEnd.toISOString().slice(0, 10)}`;

    await this.ppcModel.findOneAndUpdate(
      { projectId, specialtyId, weekStart },
      {
        projectId,
        specialtyId,
        weekStart,
        weekEnd,
        weekLabel,
        plannedTotal,
        completedTotal,
        ppcPercent,
        items,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return this.getSnapshot(projectId, specialtyId, weekStart);
  }
}
