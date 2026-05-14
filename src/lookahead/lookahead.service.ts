import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LookaheadWeekly, LookaheadWeeklyDocument } from './schemas/lookahead-weekly.schema';
import { PutLookaheadDto } from './dto/put-lookahead.dto';
import { PlanningWeekService } from '../common/planning-week/planning-week.service';

@Injectable()
export class LookaheadService {
  constructor(
    @InjectModel(LookaheadWeekly.name)
    private readonly lookaheadModel: Model<LookaheadWeeklyDocument>,
    private readonly planningWeekService: PlanningWeekService,
  ) {}

  async get(projectId: Types.ObjectId, weekAnchor: string) {
    const { weekStart, weekEnd } = await this.planningWeekService.resolveWeekForProject(
      projectId,
      weekAnchor,
    );
    const doc = await this.lookaheadModel.findOne({ projectId, weekStart }).lean().exec();
    return doc ?? { projectId, weekStart, weekEnd, items: [] };
  }

  async put(actorId: Types.ObjectId, projectId: Types.ObjectId, dto: PutLookaheadDto) {
    const { weekStart, weekEnd } = await this.planningWeekService.resolveWeekForProject(
      projectId,
      dto.weekAnchor,
    );

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

    return this.get(projectId, dto.weekAnchor);
  }
}
