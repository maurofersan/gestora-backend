import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Duty, DutyDocument } from './schemas/duty.schema';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';
import { DutyStatus } from '../common/enums/duty-status.enum';
import { CreateDutyDto } from './dto/create-duty.dto';
import { UpdateDutyDto } from './dto/update-duty.dto';

@Injectable()
export class DutiesService {
  constructor(@InjectModel(Duty.name) private readonly dutyModel: Model<DutyDocument>) {}

  list(projectId: Types.ObjectId) {
    return this.dutyModel.find({ projectId }).sort({ createdAt: -1 }).lean().exec();
  }

  async create(actor: AuthenticatedUser, projectId: Types.ObjectId, dto: CreateDutyDto) {
    const allowed =
      actor.role === UserRole.ULTIMO_PLANIFICADOR ||
      (actor.type === UserType.CLIENT && actor.role === UserRole.CLIENTE);
    if (!allowed) throw new ForbiddenException('No puedes crear urgencias');

    const duty = await this.dutyModel.create({
      projectId,
      createdByUserId: actor._id,
      description: dto.description,
      status: DutyStatus.PENDING,
      resolvedAt: null,
      resolvedByUserId: null,
    });
    return duty.toObject();
  }

  async update(actor: AuthenticatedUser, projectId: Types.ObjectId, dutyId: Types.ObjectId, dto: UpdateDutyDto) {
    const duty = await this.dutyModel.findOne({ _id: dutyId, projectId });
    if (!duty) throw new NotFoundException('Urgencia no encontrada');

    const allowed =
      actor.role === UserRole.ULTIMO_PLANIFICADOR ||
      (actor.type === UserType.CLIENT && actor.role === UserRole.CLIENTE);
    if (!allowed) throw new ForbiddenException('No puedes actualizar urgencias');

    duty.status = dto.status;
    if (dto.status === DutyStatus.RESOLVED) {
      duty.resolvedAt = new Date();
      duty.resolvedByUserId = actor._id;
    } else {
      duty.resolvedAt = null;
      duty.resolvedByUserId = null;
    }
    await duty.save();
    return duty.toObject();
  }
}
