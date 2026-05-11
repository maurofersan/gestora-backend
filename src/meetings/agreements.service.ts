import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agreement, AgreementDocument } from './schemas/agreement.schema';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { PatchAgreementDto } from './dto/patch-agreement.dto';
import { MeetingsService } from './meetings.service';
import { AgreementStatus } from '../common/enums/agreement-status.enum';

@Injectable()
export class AgreementsService {
  constructor(
    @InjectModel(Agreement.name) private readonly agreementModel: Model<AgreementDocument>,
    private readonly meetingsService: MeetingsService,
  ) {}

  async list(projectId: Types.ObjectId, meetingId: Types.ObjectId) {
    const meeting = await this.meetingsService.assertMeeting(projectId, meetingId);
    return this.agreementModel
      .find({ projectId, meetingId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async create(
    actorId: Types.ObjectId,
    projectId: Types.ObjectId,
    meetingId: Types.ObjectId,
    dto: CreateAgreementDto,
  ) {
    const meeting = await this.meetingsService.assertMeeting(projectId, meetingId);
    const agreement = await this.agreementModel.create({
      projectId,
      meetingId,
      areaId: meeting.areaId,
      text: dto.text,
      status: AgreementStatus.PENDING,
      resolvedAt: null,
      resolvedBy: null,
      createdBy: actorId,
    });
    return agreement.toObject();
  }

  async patch(
    actorId: Types.ObjectId,
    projectId: Types.ObjectId,
    agreementId: Types.ObjectId,
    dto: PatchAgreementDto,
  ) {
    const agreement = await this.agreementModel.findOne({ _id: agreementId, projectId });
    if (!agreement) throw new NotFoundException('Acuerdo no encontrado');

    agreement.status = dto.status;
    if (dto.status === AgreementStatus.RESOLVED) {
      agreement.resolvedAt = new Date();
      agreement.resolvedBy = actorId;
    } else {
      agreement.resolvedAt = null;
      agreement.resolvedBy = null;
    }
    await agreement.save();
    return agreement.toObject();
  }
}
