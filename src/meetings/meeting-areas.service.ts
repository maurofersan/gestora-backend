import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MeetingArea, MeetingAreaDocument } from './schemas/meeting-area.schema';
import { CreateMeetingAreaDto } from './dto/create-meeting-area.dto';

@Injectable()
export class MeetingAreasService {
  constructor(
    @InjectModel(MeetingArea.name)
    private readonly areaModel: Model<MeetingAreaDocument>,
  ) {}

  list(projectId: Types.ObjectId) {
    return this.areaModel.find({ projectId }).sort({ name: 1 }).lean().exec();
  }

  create(projectId: Types.ObjectId, dto: CreateMeetingAreaDto) {
    return this.areaModel.create({ projectId, name: dto.name });
  }

  async assertArea(projectId: Types.ObjectId, areaId: Types.ObjectId) {
    const area = await this.areaModel.findOne({ _id: areaId, projectId }).lean().exec();
    if (!area) throw new NotFoundException('Área no encontrada');
    return area;
  }
}
