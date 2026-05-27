import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MeetingArea, MeetingAreaDocument } from './schemas/meeting-area.schema';
import { CreateMeetingAreaDto } from './dto/create-meeting-area.dto';
import { AgreementCountsService } from './agreement-counts.service';

@Injectable()
export class MeetingAreasService {
  constructor(
    @InjectModel(MeetingArea.name)
    private readonly areaModel: Model<MeetingAreaDocument>,
    private readonly agreementCounts: AgreementCountsService,
  ) {}

  async list(projectId: Types.ObjectId) {
    const [areas, pendingByArea] = await Promise.all([
      this.areaModel.find({ projectId }).sort({ name: 1 }).lean().exec(),
      this.agreementCounts.pendingCountByArea(projectId),
    ]);

    return areas.map((area) => ({
      ...area,
      pendingAgreementsCount: pendingByArea.get(area._id.toString()) ?? 0,
    }));
  }

  async create(projectId: Types.ObjectId, dto: CreateMeetingAreaDto) {
    const area = await this.areaModel.create({ projectId, name: dto.name });
    return {
      ...area.toObject(),
      pendingAgreementsCount: 0,
    };
  }

  async assertArea(projectId: Types.ObjectId, areaId: Types.ObjectId) {
    const area = await this.areaModel.findOne({ _id: areaId, projectId }).lean().exec();
    if (!area) throw new NotFoundException('Área no encontrada');
    return area;
  }
}
