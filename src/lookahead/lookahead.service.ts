import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LookaheadWeekly, LookaheadWeeklyDocument } from './schemas/lookahead-weekly.schema';
import { PutLookaheadDto } from './dto/put-lookahead.dto';
import { getWeekRangeMondaySunday } from '../common/utils/week-range.util';

@Injectable()
export class LookaheadService {
  constructor(
    @InjectModel(LookaheadWeekly.name)
    private readonly lookaheadModel: Model<LookaheadWeeklyDocument>,
  ) {}

  async get(projectId: Types.ObjectId, weekAnchor: Date) {
    const { weekStart, weekEnd } = getWeekRangeMondaySunday(new Date(weekAnchor));
    const doc = await this.lookaheadModel.findOne({ projectId, weekStart }).lean().exec();
    return doc ?? { projectId, weekStart, weekEnd, items: [] };
  }

  async put(actorId: Types.ObjectId, projectId: Types.ObjectId, dto: PutLookaheadDto) {
    const { weekStart, weekEnd } = getWeekRangeMondaySunday(new Date(dto.weekAnchor));

    const items = dto.items.map((i) => ({
      activityId: new Types.ObjectId(i.activityId),
      commitment: i.commitment,
      notes: i.notes ?? null,
      updatedAt: new Date(),
      updatedBy: actorId,
    }));

    await this.lookaheadModel.findOneAndUpdate(
      { projectId, weekStart },
      {
        projectId,
        weekStart,
        weekEnd,
        items,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return this.get(projectId, weekStart);
  }
}
