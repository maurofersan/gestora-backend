import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScheduleUpload, ScheduleUploadDocument } from './schemas/schedule-upload.schema';
import { CreateScheduleUploadDto } from './dto/create-schedule-upload.dto';

@Injectable()
export class ScheduleUploadsService {
  constructor(
    @InjectModel(ScheduleUpload.name)
    private readonly uploadModel: Model<ScheduleUploadDocument>,
  ) {}

  list(projectId: Types.ObjectId) {
    return this.uploadModel.find({ projectId }).sort({ createdAt: -1 }).limit(50).lean().exec();
  }

  create(actorId: Types.ObjectId, projectId: Types.ObjectId, dto: CreateScheduleUploadDto) {
    return this.uploadModel.create({
      projectId,
      uploadedBy: actorId,
      fileUrl: dto.fileUrl,
      sourceType: dto.sourceType,
      parsedStatus: 'pending',
      stats: { activitiesCreated: 0, activitiesUpdated: 0, errors: 0 },
    });
  }
}
