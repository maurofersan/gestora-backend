import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkPackage, WorkPackageDocument } from './schemas/work-package.schema';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Specialty, SpecialtyDocument } from '../specialties/schemas/specialty.schema';

@Injectable()
export class WorkPackagesService {
  constructor(
    @InjectModel(WorkPackage.name)
    private readonly workPackageModel: Model<WorkPackageDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Specialty.name)
    private readonly specialtyModel: Model<SpecialtyDocument>,
  ) {}

  async list(projectId: Types.ObjectId) {
    return this.workPackageModel.find({ projectId }).sort({ order: 1, name: 1 }).lean().exec();
  }

  async create(projectId: Types.ObjectId, companyId: Types.ObjectId, dto: CreateWorkPackageDto) {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (!project.companyId.equals(companyId)) throw new ForbiddenException();

    const specialty = await this.specialtyModel.findById(dto.specialtyId).lean().exec();
    if (!specialty || !specialty.companyId.equals(companyId)) {
      throw new ForbiddenException('Especialidad inválida para esta empresa');
    }

    return this.workPackageModel.create({
      projectId,
      name: dto.name,
      specialtyId: new Types.ObjectId(dto.specialtyId),
      order: dto.order ?? 0,
    });
  }
}
