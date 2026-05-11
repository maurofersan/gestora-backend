import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sector, SectorDocument } from './schemas/sector.schema';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class SectorsService {
  constructor(@InjectModel(Sector.name) private readonly sectorModel: Model<SectorDocument>) {}

  list(projectId: Types.ObjectId) {
    return this.sectorModel.find({ projectId }).sort({ order: 1, name: 1 }).lean().exec();
  }

  create(projectId: Types.ObjectId, dto: CreateSectorDto) {
    return this.sectorModel.create({
      projectId,
      name: dto.name,
      order: dto.order ?? 0,
    });
  }
}
