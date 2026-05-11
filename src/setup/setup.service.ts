import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { BootstrapDto } from './dto/bootstrap.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { UserType } from '../common/enums/user-type.enum';

@Injectable()
export class SetupService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async bootstrap(dto: BootstrapDto) {
    const existingCompanies = await this.companyModel.countDocuments();
    if (existingCompanies > 0) {
      throw new ConflictException('La base ya fue inicializada');
    }

    const company = await this.companyModel.create({ name: dto.companyName, status: 'active' });
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const admin = await this.userModel.create({
      companyId: company._id,
      fullName: dto.adminFullName,
      email: dto.adminEmail.toLowerCase(),
      phone: null,
      passwordHash,
      type: UserType.COMPANY,
      role: UserRole.ULTIMO_PLANIFICADOR,
      specialtyId: null,
      projectIds: [],
      status: 'active',
    });

    return {
      companyId: company._id,
      adminUserId: admin._id,
      message: 'OK: crea especialidades, usuario cliente y proyecto; luego asigna projectIds al admin.',
    };
  }
}
