import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../../projects/schemas/project.schema';
import type { PlanningWeekResolution } from './planning-week.types';
import {
  normalizeProjectTimeZone,
  resolvePlanningWeekFromAnchor,
} from './resolve-planning-week';

@Injectable()
export class PlanningWeekService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async getProjectTimeZone(projectId: Types.ObjectId): Promise<string> {
    const p = await this.projectModel.findById(projectId).select('timezone').lean().exec();
    if (!p) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return normalizeProjectTimeZone(p.timezone);
  }

  async resolveWeekForProject(
    projectId: Types.ObjectId,
    weekAnchor: string,
  ): Promise<PlanningWeekResolution> {
    const p = await this.projectModel.findById(projectId).select('timezone').lean().exec();
    if (!p) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    const tz = normalizeProjectTimeZone(p.timezone);
    try {
      return {
        ...resolvePlanningWeekFromAnchor(weekAnchor.trim(), tz),
        projectTimeZone: tz,
      };
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'INVALID_WEEK_ANCHOR_FORMAT') {
        throw new BadRequestException(
          'weekAnchor debe ser YYYY-MM-DD (fecha civil en la zona del proyecto, típicamente el lunes de la semana).',
        );
      }
      throw new BadRequestException('weekAnchor no es una fecha civil válida en la zona del proyecto.');
    }
  }
}
