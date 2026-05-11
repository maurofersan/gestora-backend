import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingAreasService } from './meeting-areas.service';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    private readonly areasService: MeetingAreasService,
  ) {}

  async list(projectId: Types.ObjectId, areaId: Types.ObjectId) {
    await this.areasService.assertArea(projectId, areaId);
    return this.meetingModel
      .find({ projectId, areaId })
      .sort({ meetingDate: -1 })
      .lean()
      .exec();
  }

  async create(
    actorId: Types.ObjectId,
    projectId: Types.ObjectId,
    areaId: Types.ObjectId,
    dto: CreateMeetingDto,
  ) {
    await this.areasService.assertArea(projectId, areaId);
    const meeting = await this.meetingModel.create({
      projectId,
      areaId,
      title: dto.title,
      meetingDate: dto.meetingDate,
      status: 'open',
      createdBy: actorId,
    });
    return meeting.toObject();
  }

  async assertMeeting(projectId: Types.ObjectId, meetingId: Types.ObjectId) {
    const meeting = await this.meetingModel.findOne({ _id: meetingId, projectId }).exec();
    if (!meeting) throw new NotFoundException('Reunión no encontrada');
    return meeting;
  }
}
