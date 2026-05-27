import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agreement, AgreementDocument } from './schemas/agreement.schema';
import { AgreementStatus } from '../common/enums/agreement-status.enum';

export type MeetingAgreementCounts = {
  agreementsTotal: number;
  agreementsPending: number;
};

@Injectable()
export class AgreementCountsService {
  constructor(
    @InjectModel(Agreement.name) private readonly agreementModel: Model<AgreementDocument>,
  ) {}

  async pendingCountByArea(projectId: Types.ObjectId): Promise<Map<string, number>> {
    const rows = await this.agreementModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { projectId, status: AgreementStatus.PENDING } },
        { $group: { _id: '$areaId', count: { $sum: 1 } } },
      ])
      .exec();

    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }

  async countsByMeetingIds(
    projectId: Types.ObjectId,
    meetingIds: Types.ObjectId[],
  ): Promise<Map<string, MeetingAgreementCounts>> {
    if (meetingIds.length === 0) {
      return new Map();
    }

    const rows = await this.agreementModel
      .aggregate<{ _id: Types.ObjectId; agreementsTotal: number; agreementsPending: number }>([
        { $match: { projectId, meetingId: { $in: meetingIds } } },
        {
          $group: {
            _id: '$meetingId',
            agreementsTotal: { $sum: 1 },
            agreementsPending: {
              $sum: {
                $cond: [{ $eq: ['$status', AgreementStatus.PENDING] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    return new Map(
      rows.map((row) => [
        row._id.toString(),
        {
          agreementsTotal: row.agreementsTotal,
          agreementsPending: row.agreementsPending,
        },
      ]),
    );
  }
}
