import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  create(dto: CreateCompanyDto) {
    return this.companyModel.create({ name: dto.name, status: 'active' });
  }

  findById(id: string) {
    return this.companyModel.findById(id).lean().exec();
  }
}
