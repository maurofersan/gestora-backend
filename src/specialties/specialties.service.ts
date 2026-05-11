import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Specialty, SpecialtyDocument } from './schemas/specialty.schema';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectModel(Specialty.name) private readonly specialtyModel: Model<SpecialtyDocument>,
  ) {}

  assertCompany(actor: AuthenticatedUser, companyId: string) {
    if (!actor.companyId || actor.companyId.toString() !== companyId) {
      throw new ForbiddenException('Empresa no permitida');
    }
  }

  list(companyId: Types.ObjectId) {
    return this.specialtyModel.find({ companyId }).sort({ name: 1 }).lean().exec();
  }

  create(actor: AuthenticatedUser, companyId: Types.ObjectId, dto: CreateSpecialtyDto) {
    this.assertCompany(actor, companyId.toString());
    return this.specialtyModel.create({ companyId, name: dto.name, status: 'active' });
  }
}
